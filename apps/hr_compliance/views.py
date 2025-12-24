from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import (
    RegulationCategory, Regulation, HRPolicy, PolicyAcknowledgment,
    ComplianceTraining, TrainingCompletion, ComplianceAudit,
    ComplianceIncident, ComplianceDashboard
)
from .serializers import (
    RegulationCategorySerializer, RegulationSerializer, HRPolicySerializer,
    PolicyAcknowledgmentSerializer, ComplianceTrainingSerializer,
    TrainingCompletionSerializer, ComplianceAuditSerializer,
    ComplianceIncidentSerializer, ComplianceDashboardSerializer
)


class RegulationCategoryViewSet(viewsets.ModelViewSet):
    queryset = RegulationCategory.objects.all()
    serializer_class = RegulationCategorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category_type', 'federal_level', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'category_type']


class RegulationViewSet(viewsets.ModelViewSet):
    queryset = Regulation.objects.all()
    serializer_class = RegulationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'jurisdiction', 'status']
    search_fields = ['name', 'official_name', 'description']
    ordering_fields = ['name', 'jurisdiction', 'effective_date']

    @action(detail=False, methods=['get'])
    def by_jurisdiction(self, request):
        """Get all regulations for a specific jurisdiction"""
        jurisdiction = request.query_params.get('jurisdiction')
        location = request.query_params.get('location')
        
        regulations = Regulation.objects.filter(jurisdiction=jurisdiction)
        if location:
            regulations = regulations.filter(jurisdiction_location=location)
        
        serializer = self.get_serializer(regulations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get all regulations in a specific category"""
        category = request.query_params.get('category')
        regulations = Regulation.objects.filter(category__category_type=category)
        
        serializer = self.get_serializer(regulations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def related_policies(self, request, pk=None):
        """Get all policies related to this regulation"""
        regulation = self.get_object()
        policies = regulation.policies.all()
        serializer = HRPolicySerializer(policies, many=True)
        return Response(serializer.data)


class HRPolicyViewSet(viewsets.ModelViewSet):
    queryset = HRPolicy.objects.all()
    serializer_class = HRPolicySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['policy_type', 'status', 'is_mandatory']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'effective_date', 'policy_type']

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Record policy acknowledgment"""
        policy = self.get_object()
        employee = request.user.employee
        
        acknowledgment, created = PolicyAcknowledgment.objects.update_or_create(
            employee=employee,
            policy=policy,
            defaults={
                'status': 'ACKNOWLEDGED',
                'acknowledged_date': timezone.now(),
                'ip_address': self.get_client_ip(request),
                'device_info': request.META.get('HTTP_USER_AGENT', '')
            }
        )
        
        serializer = PolicyAcknowledgmentSerializer(acknowledgment)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def acknowledgment_status(self, request, pk=None):
        """Get acknowledgment status for this policy"""
        policy = self.get_object()
        acknowledgments = policy.acknowledgments.all()
        
        stats = {
            'total': acknowledgments.count(),
            'acknowledged': acknowledgments.filter(status='ACKNOWLEDGED').count(),
            'pending': acknowledgments.filter(status='PENDING').count(),
            'declined': acknowledgments.filter(status='DECLINED').count(),
            'percentage': 0
        }
        
        if stats['total'] > 0:
            stats['percentage'] = round((stats['acknowledged'] / stats['total']) * 100, 2)
        
        return Response(stats)

    @action(detail=False, methods=['get'])
    def pending_acknowledgments(self, request):
        """Get all policies pending acknowledgment for current user"""
        employee = request.user.employee
        pending = HRPolicy.objects.filter(
            is_mandatory=True,
            status='ACTIVE'
        ).exclude(
            acknowledgments__employee=employee,
            acknowledgments__status='ACKNOWLEDGED'
        )
        
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PolicyAcknowledgmentViewSet(viewsets.ModelViewSet):
    queryset = PolicyAcknowledgment.objects.all()
    serializer_class = PolicyAcknowledgmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'policy', 'status']
    search_fields = ['employee__full_name', 'policy__title']
    ordering_fields = ['acknowledged_date', 'created_at']


class ComplianceTrainingViewSet(viewsets.ModelViewSet):
    queryset = ComplianceTraining.objects.all()
    serializer_class = ComplianceTrainingSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['requirement_type', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'training_frequency_months']

    @action(detail=True, methods=['post'])
    def schedule_for_department(self, request, pk=None):
        """Schedule training for all employees in a department"""
        training = self.get_object()
        department_id = request.data.get('department_id')
        from apps.core.models import Employee
        
        employees = Employee.objects.filter(
            department_id=department_id,
            is_active=True
        )
        
        scheduled_date = request.data.get('scheduled_date')
        created = 0
        
        for employee in employees:
            completion, new = TrainingCompletion.objects.get_or_create(
                employee=employee,
                training=training,
                scheduled_date=scheduled_date,
                defaults={'status': 'SCHEDULED'}
            )
            if new:
                created += 1
        
        return Response({
            'message': f'{created} training sessions scheduled',
            'total_employees': employees.count()
        })

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue trainings for employees"""
        from django.utils import timezone
        completions = TrainingCompletion.objects.filter(
            next_due_date__lt=timezone.now().date(),
            status__in=['SCHEDULED', 'IN_PROGRESS']
        )
        
        serializer = TrainingCompletionSerializer(completions, many=True)
        return Response(serializer.data)


class TrainingCompletionViewSet(viewsets.ModelViewSet):
    queryset = TrainingCompletion.objects.all()
    serializer_class = TrainingCompletionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'training', 'status']
    search_fields = ['employee__full_name', 'training__title']
    ordering_fields = ['scheduled_date', 'completion_date']

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark training as completed"""
        completion = self.get_object()
        
        completion.status = 'COMPLETED'
        completion.completion_date = timezone.now().date()
        completion.score = request.data.get('score')
        completion.passed = request.data.get('passed', True)
        completion.certificate_url = request.data.get('certificate_url', '')
        
        # Calculate next due date
        if completion.training.training_frequency_months > 0:
            from dateutil.relativedelta import relativedelta
            completion.next_due_date = completion.completion_date + relativedelta(
                months=completion.training.training_frequency_months
            )
        
        completion.save()
        
        serializer = self.get_serializer(completion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def employee_pending(self, request):
        """Get pending trainings for current employee"""
        employee = request.user.employee
        pending = TrainingCompletion.objects.filter(
            employee=employee,
            status__in=['SCHEDULED', 'IN_PROGRESS']
        ).select_related('training')
        
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)


class ComplianceAuditViewSet(viewsets.ModelViewSet):
    queryset = ComplianceAudit.objects.all()
    serializer_class = ComplianceAuditSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'status']
    search_fields = ['title', 'scope']
    ordering_fields = ['scheduled_date', 'completion_date']

    @action(detail=True, methods=['post'])
    def start_audit(self, request, pk=None):
        """Start a scheduled audit"""
        audit = self.get_object()
        audit.status = 'IN_PROGRESS'
        audit.save()
        
        serializer = self.get_serializer(audit)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_audit(self, request, pk=None):
        """Complete an audit"""
        audit = self.get_object()
        
        audit.status = 'COMPLETED'
        audit.completion_date = timezone.now().date()
        audit.overall_compliance_score = request.data.get('overall_compliance_score')
        audit.findings = request.data.get('findings', {})
        audit.recommendations = request.data.get('recommendations', [])
        audit.follow_up_required = request.data.get('follow_up_required', False)
        
        if audit.follow_up_required:
            audit.follow_up_date = request.data.get('follow_up_date')
        
        audit.save()
        
        serializer = self.get_serializer(audit)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_audits(self, request):
        """Get pending and scheduled audits"""
        audits = ComplianceAudit.objects.filter(
            status__in=['SCHEDULED', 'IN_PROGRESS']
        )
        
        serializer = self.get_serializer(audits, many=True)
        return Response(serializer.data)


class ComplianceIncidentViewSet(viewsets.ModelViewSet):
    queryset = ComplianceIncident.objects.all()
    serializer_class = ComplianceIncidentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['severity', 'status', 'legal_review_required']
    search_fields = ['title', 'description', 'violation_type']
    ordering_fields = ['reported_date', 'severity', 'status']

    @action(detail=True, methods=['post'])
    def escalate_to_legal(self, request, pk=None):
        """Escalate incident to legal department"""
        incident = self.get_object()
        incident.legal_review_required = True
        incident.escalated_to_legal = True
        incident.status = 'ESCALATED'
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve_incident(self, request, pk=None):
        """Mark incident as resolved"""
        incident = self.get_object()
        
        incident.status = 'RESOLVED'
        incident.resolution_date = timezone.now().date()
        incident.resolution = request.data.get('resolution', '')
        incident.corrective_actions = request.data.get('corrective_actions', [])
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def open_incidents(self, request):
        """Get all open incidents"""
        incidents = ComplianceIncident.objects.filter(
            status__in=['REPORTED', 'INVESTIGATING', 'ESCALATED']
        ).order_by('-severity', '-reported_date')
        
        serializer = self.get_serializer(incidents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def critical_incidents(self, request):
        """Get all critical incidents"""
        incidents = ComplianceIncident.objects.filter(
            severity='CRITICAL'
        ).order_by('-reported_date')
        
        serializer = self.get_serializer(incidents, many=True)
        return Response(serializer.data)


class ComplianceDashboardViewSet(viewsets.ModelViewSet):
    queryset = ComplianceDashboard.objects.all()
    serializer_class = ComplianceDashboardSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'compliance_status']
    ordering_fields = ['department__name', 'compliance_status']

    @action(detail=True, methods=['post'])
    def update_metrics(self, request, pk=None):
        """Update compliance metrics for a department"""
        dashboard = self.get_object()
        department = dashboard.department
        
        # Calculate policy metrics
        dashboard.total_policies = HRPolicy.objects.filter(status='ACTIVE').count()
        dashboard.acknowledged_policies = PolicyAcknowledgment.objects.filter(
            employee__department=department,
            status='ACKNOWLEDGED'
        ).count()
        dashboard.pending_acknowledgments = PolicyAcknowledgment.objects.filter(
            employee__department=department,
            status='PENDING'
        ).count()
        
        # Calculate training metrics
        dashboard.required_trainings = TrainingCompletion.objects.filter(
            employee__department=department,
            training__requirement_type='REQUIRED'
        ).count()
        dashboard.completed_trainings = TrainingCompletion.objects.filter(
            employee__department=department,
            status='COMPLETED'
        ).count()
        dashboard.overdue_trainings = TrainingCompletion.objects.filter(
            employee__department=department,
            next_due_date__lt=timezone.now().date(),
            status__in=['SCHEDULED', 'IN_PROGRESS']
        ).count()
        
        # Calculate incident metrics
        dashboard.open_incidents = ComplianceIncident.objects.filter(
            employee__department=department,
            status__in=['REPORTED', 'INVESTIGATING', 'ESCALATED']
        ).count()
        dashboard.critical_incidents = ComplianceIncident.objects.filter(
            employee__department=department,
            severity='CRITICAL'
        ).count()
        
        # Get latest audit score
        latest_audit = ComplianceAudit.objects.filter(
            department=department,
            status='COMPLETED'
        ).order_by('-completion_date').first()
        
        if latest_audit:
            dashboard.audit_compliance_score = latest_audit.overall_compliance_score
            dashboard.last_audit_date = latest_audit.completion_date
        
        # Determine overall compliance status
        if dashboard.audit_compliance_score is not None:
            if dashboard.audit_compliance_score >= 90:
                dashboard.compliance_status = 'COMPLIANT'
            elif dashboard.audit_compliance_score >= 70:
                dashboard.compliance_status = 'REVIEW_NEEDED'
            else:
                dashboard.compliance_status = 'NON_COMPLIANT'
        
        dashboard.save()
        
        serializer = self.get_serializer(dashboard)
        return Response(serializer.data)
