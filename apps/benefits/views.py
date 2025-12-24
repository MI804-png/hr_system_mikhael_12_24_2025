from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import (
    BenefitType, BenefitPackage, HealthInsurance, RetirementPlan,
    EmployeeBenefitEnrollment, HealthInsuranceEnrollment, RetirementPlanEnrollment,
    Reimbursement, WellnessProgram, WellnessProgramParticipation
)
from .serializers import (
    BenefitTypeSerializer, BenefitPackageSerializer, HealthInsuranceSerializer,
    RetirementPlanSerializer, EmployeeBenefitEnrollmentSerializer,
    HealthInsuranceEnrollmentSerializer, RetirementPlanEnrollmentSerializer,
    ReimbursementSerializer, WellnessProgramSerializer, WellnessProgramParticipationSerializer
)

class BenefitTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BenefitType.objects.all()
    serializer_class = BenefitTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'description']

class BenefitPackageViewSet(viewsets.ModelViewSet):
    queryset = BenefitPackage.objects.all()
    serializer_class = BenefitPackageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']

class HealthInsuranceViewSet(viewsets.ModelViewSet):
    queryset = HealthInsurance.objects.all()
    serializer_class = HealthInsuranceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['plan_type', 'is_active']
    search_fields = ['plan_name', 'provider']

class RetirementPlanViewSet(viewsets.ModelViewSet):
    queryset = RetirementPlan.objects.all()
    serializer_class = RetirementPlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['plan_type', 'is_active']
    search_fields = ['plan_name', 'provider']

class EmployeeBenefitEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeBenefitEnrollment.objects.all()
    serializer_class = EmployeeBenefitEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'status', 'benefit_package']
    ordering_fields = ['enrollment_date', 'effective_date']

class HealthInsuranceEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = HealthInsuranceEnrollment.objects.all()
    serializer_class = HealthInsuranceEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'status', 'insurance_plan']
    
    @action(detail=True, methods=['post'])
    def terminate_enrollment(self, request, pk=None):
        enrollment = self.get_object()
        from datetime import date
        enrollment.status = 'terminated'
        enrollment.termination_date = request.data.get('termination_date', date.today())
        enrollment.save()
        return Response(HealthInsuranceEnrollmentSerializer(enrollment).data)

class RetirementPlanEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = RetirementPlanEnrollment.objects.all()
    serializer_class = RetirementPlanEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'retirement_plan']
    ordering_fields = ['enrollment_date']

class ReimbursementViewSet(viewsets.ModelViewSet):
    queryset = Reimbursement.objects.all()
    serializer_class = ReimbursementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'category', 'employee']
    search_fields = ['description']
    ordering_fields = ['submission_date', 'amount']
    
    @action(detail=True, methods=['post'])
    def approve_reimbursement(self, request, pk=None):
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reimbursement = self.get_object()
        from django.utils import timezone
        reimbursement.status = 'approved'
        reimbursement.approved_by = request.user
        reimbursement.approval_date = timezone.now().date()
        reimbursement.save()
        return Response(ReimbursementSerializer(reimbursement).data)
    
    @action(detail=True, methods=['post'])
    def reject_reimbursement(self, request, pk=None):
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reimbursement = self.get_object()
        reimbursement.status = 'rejected'
        reimbursement.rejection_reason = request.data.get('reason', '')
        reimbursement.save()
        return Response(ReimbursementSerializer(reimbursement).data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        reimbursement = self.get_object()
        from django.utils import timezone
        reimbursement.status = 'paid'
        reimbursement.paid_date = timezone.now().date()
        reimbursement.save()
        return Response(ReimbursementSerializer(reimbursement).data)

class WellnessProgramViewSet(viewsets.ModelViewSet):
    queryset = WellnessProgram.objects.all()
    serializer_class = WellnessProgramSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'description']

class WellnessProgramParticipationViewSet(viewsets.ModelViewSet):
    queryset = WellnessProgramParticipation.objects.all()
    serializer_class = WellnessProgramParticipationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'wellness_program', 'is_active']
    ordering_fields = ['enrollment_date']
