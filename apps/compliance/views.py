from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import (
    CompanyPolicy, PolicyAcknowledgment, DisciplinaryAction,
    ComplianceRecord, AuditLog, LaborLawCompliance, RiskAssessment
)
from .serializers import (
    CompanyPolicySerializer, PolicyAcknowledgmentSerializer,
    DisciplinaryActionSerializer, ComplianceRecordSerializer,
    AuditLogSerializer, LaborLawComplianceSerializer, RiskAssessmentSerializer
)

class CompanyPolicyViewSet(viewsets.ModelViewSet):
    queryset = CompanyPolicy.objects.all()
    serializer_class = CompanyPolicySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['policy_type', 'is_active']
    search_fields = ['title', 'description']

class PolicyAcknowledgmentViewSet(viewsets.ModelViewSet):
    queryset = PolicyAcknowledgment.objects.all()
    serializer_class = PolicyAcknowledgmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'policy']
    
    @action(detail=False, methods=['post'])
    def acknowledge_policy(self, request):
        employee_id = request.data.get('employee_id')
        policy_id = request.data.get('policy_id')
        
        if not employee_id or not policy_id:
            return Response(
                {'detail': 'employee_id and policy_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        from apps.employees.models import Employee
        from .models import CompanyPolicy
        
        try:
            employee = Employee.objects.get(id=employee_id)
            policy = CompanyPolicy.objects.get(id=policy_id)
        except (Employee.DoesNotExist, CompanyPolicy.DoesNotExist):
            return Response(
                {'detail': 'Employee or Policy not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        acknowledgment, created = PolicyAcknowledgment.objects.get_or_create(
            employee=employee,
            policy=policy,
            defaults={'acknowledged_date': timezone.now()}
        )
        
        return Response(PolicyAcknowledgmentSerializer(acknowledgment).data)

class DisciplinaryActionViewSet(viewsets.ModelViewSet):
    queryset = DisciplinaryAction.objects.all()
    serializer_class = DisciplinaryActionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'action_type', 'severity']
    ordering_fields = ['action_date']
    
    @action(detail=True, methods=['post'])
    def submit_appeal(self, request, pk=None):
        action = self.get_object()
        action.appeal_submitted = True
        action.appeal_date = request.data.get('appeal_date')
        action.appeal_outcome = request.data.get('outcome', '')
        action.save()
        return Response(DisciplinaryActionSerializer(action).data)

class ComplianceRecordViewSet(viewsets.ModelViewSet):
    queryset = ComplianceRecord.objects.all()
    serializer_class = ComplianceRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['record_type', 'status']
    search_fields = ['title', 'description']
    ordering_fields = ['check_date', 'due_date']
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        record = self.get_object()
        record.status = request.data.get('status', record.status)
        if record.status == 'compliant':
            record.remedial_actions = 'None'
        record.save()
        return Response(ComplianceRecordSerializer(record).data)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['audit_type', 'affected_module', 'user']
    ordering_fields = ['timestamp']

class LaborLawComplianceViewSet(viewsets.ModelViewSet):
    queryset = LaborLawCompliance.objects.all()
    serializer_class = LaborLawComplianceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['jurisdiction', 'compliance_status']
    search_fields = ['name', 'description']

class RiskAssessmentViewSet(viewsets.ModelViewSet):
    queryset = RiskAssessment.objects.all()
    serializer_class = RiskAssessmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['risk_area', 'risk_level', 'status']
    ordering_fields = ['assessment_date', 'target_resolution_date']
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        assessment = self.get_object()
        assessment.status = request.data.get('status', assessment.status)
        assessment.save()
        return Response(RiskAssessmentSerializer(assessment).data)
