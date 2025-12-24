from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from datetime import datetime, timedelta

from .models import (
    ESGObjective, VolunteerProgram, EmployeeVolunteerLog, SustainabilityInitiative,
    DiversityMetric, CommunityOutreach, CSRReport
)
from .serializers import (
    ESGObjectiveSerializer, VolunteerProgramSerializer, VolunteerProgramDetailedSerializer,
    EmployeeVolunteerLogSerializer, SustainabilityInitiativeSerializer, DiversityMetricSerializer,
    CommunityOutreachSerializer, CSRReportSerializer
)


class ESGObjectiveViewSet(viewsets.ModelViewSet):
    """Manage ESG objectives and goals"""
    queryset = ESGObjective.objects.all()
    serializer_class = ESGObjectiveSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'priority', 'status']
    ordering_fields = ['target_date', 'priority', 'progress_percentage']
    ordering = ['target_date']

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update current progress on objective"""
        objective = self.get_object()
        new_value = request.data.get('current_value')
        
        if new_value is None:
            return Response({'error': 'current_value is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        objective.current_value = new_value
        
        # Update status based on progress
        if objective.progress_percentage >= 100:
            objective.status = 'COMPLETED'
        elif objective.progress_percentage >= 75:
            objective.status = 'ON_TRACK'
        else:
            objective.status = 'AT_RISK'
        
        objective.save()
        serializer = self.get_serializer(objective)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Group objectives by category"""
        categories = {}
        for obj in ESGObjective.objects.all():
            cat = obj.get_category_display()
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(ESGObjectiveSerializer(obj).data)
        return Response(categories)


class VolunteerProgramViewSet(viewsets.ModelViewSet):
    """Manage volunteer programs"""
    queryset = VolunteerProgram.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'cause_area']
    ordering_fields = ['start_date', 'actual_hours']
    ordering = ['-start_date']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VolunteerProgramDetailedSerializer
        return VolunteerProgramSerializer

    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        """Add employee to volunteer program"""
        program = self.get_object()
        employee_id = request.data.get('employee_id')
        
        if not employee_id:
            return Response({'error': 'employee_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        program.participating_employees.add(employee_id)
        serializer = self.get_serializer(program)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """Remove employee from volunteer program"""
        program = self.get_object()
        employee_id = request.data.get('employee_id')
        
        if not employee_id:
            return Response({'error': 'employee_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        program.participating_employees.remove(employee_id)
        serializer = self.get_serializer(program)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete volunteer program"""
        program = self.get_object()
        program.status = 'COMPLETED'
        program.end_date = timezone.now().date()
        program.save()
        
        serializer = self.get_serializer(program)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_programs(self, request):
        """Get all active volunteer programs"""
        programs = VolunteerProgram.objects.filter(status='ACTIVE')
        serializer = self.get_serializer(programs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get volunteer program statistics"""
        total_hours = VolunteerProgram.objects.aggregate(Sum('actual_hours'))['actual_hours__sum'] or 0
        total_programs = VolunteerProgram.objects.filter(status='ACTIVE').count()
        total_participants = EmployeeVolunteerLog.objects.values('employee').distinct().count()
        
        return Response({
            'total_hours': total_hours,
            'active_programs': total_programs,
            'unique_participants': total_participants
        })


class EmployeeVolunteerLogViewSet(viewsets.ModelViewSet):
    """Track employee volunteer hours"""
    queryset = EmployeeVolunteerLog.objects.all()
    serializer_class = EmployeeVolunteerLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['volunteer_program', 'employee', 'approved']
    ordering_fields = ['volunteer_date', 'hours']
    ordering = ['-volunteer_date']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve volunteer hours"""
        log = self.get_object()
        log.approved = True
        log.approved_by = request.user.employee
        log.approved_date = timezone.now().date()
        log.save()
        
        # Update program actual hours
        program = log.volunteer_program
        program.actual_hours = program.volunteer_logs.filter(approved=True).aggregate(Sum('hours'))['hours__sum'] or 0
        program.save()
        
        serializer = self.get_serializer(log)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get pending volunteer logs"""
        logs = EmployeeVolunteerLog.objects.filter(approved=False)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)


class SustainabilityInitiativeViewSet(viewsets.ModelViewSet):
    """Manage sustainability initiatives"""
    queryset = SustainabilityInitiative.objects.all()
    serializer_class = SustainabilityInitiativeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'initiative_type']
    ordering_fields = ['start_date', 'reduction_percentage_achieved']
    ordering = ['-start_date']

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update initiative progress"""
        initiative = self.get_object()
        current_value = request.data.get('current_value')
        
        if current_value is None:
            return Response({'error': 'current_value is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        initiative.current_value = current_value
        initiative.save()
        
        serializer = self.get_serializer(initiative)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def record_spending(self, request, pk=None):
        """Record spending on initiative"""
        initiative = self.get_object()
        amount = request.data.get('amount')
        
        if amount is None:
            return Response({'error': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        initiative.budget_spent += amount
        initiative.save()
        
        serializer = self.get_serializer(initiative)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def environmental_impact(self, request):
        """Calculate total environmental impact"""
        initiatives = SustainabilityInitiative.objects.filter(status__in=['IN_PROGRESS', 'COMPLETED'])
        
        total_baseline = initiatives.aggregate(Sum('baseline_value'))['baseline_value__sum'] or 0
        total_achieved = initiatives.aggregate(Sum('current_value'))['current_value__sum'] or 0
        
        return Response({
            'total_baseline': str(total_baseline),
            'total_achieved': str(total_achieved),
            'total_reduction': str(total_baseline - total_achieved)
        })


class DiversityMetricViewSet(viewsets.ModelViewSet):
    """Track diversity metrics"""
    queryset = DiversityMetric.objects.all()
    serializer_class = DiversityMetricSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['metric_type', 'report_date']
    ordering_fields = ['report_date', 'percentage']
    ordering = ['-report_date']

    @action(detail=False, methods=['get'])
    def latest_report(self, request):
        """Get latest diversity metrics"""
        latest_date = DiversityMetric.objects.values('report_date').distinct().order_by('-report_date').first()
        
        if not latest_date:
            return Response({'error': 'No diversity metrics found'}, status=status.HTTP_404_NOT_FOUND)
        
        metrics = DiversityMetric.objects.filter(report_date=latest_date['report_date'])
        serializer = self.get_serializer(metrics, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Group metrics by type"""
        metric_type = request.query_params.get('metric_type')
        
        if not metric_type:
            return Response({'error': 'metric_type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        metrics = DiversityMetric.objects.filter(metric_type=metric_type).order_by('-report_date')
        serializer = self.get_serializer(metrics, many=True)
        return Response(serializer.data)


class CommunityOutreachViewSet(viewsets.ModelViewSet):
    """Manage community outreach programs"""
    queryset = CommunityOutreach.objects.all()
    serializer_class = CommunityOutreachSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'community_focus']
    ordering_fields = ['start_date', 'beneficiary_reach']
    ordering = ['-start_date']

    @action(detail=True, methods=['post'])
    def record_beneficiaries(self, request, pk=None):
        """Record number of beneficiaries reached"""
        outreach = self.get_object()
        actual_beneficiaries = request.data.get('actual_beneficiaries')
        
        if actual_beneficiaries is None:
            return Response({'error': 'actual_beneficiaries is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        outreach.actual_beneficiaries = actual_beneficiaries
        outreach.save()
        
        serializer = self.get_serializer(outreach)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def record_spending(self, request, pk=None):
        """Record spending on outreach"""
        outreach = self.get_object()
        amount = request.data.get('amount')
        
        if amount is None:
            return Response({'error': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        outreach.budget_spent += amount
        outreach.save()
        
        serializer = self.get_serializer(outreach)
        return Response(serializer.data)


class CSRReportViewSet(viewsets.ModelViewSet):
    """Generate and manage CSR reports"""
    queryset = CSRReport.objects.all()
    serializer_class = CSRReportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['report_year', 'status']
    ordering_fields = ['report_year', 'created_date']
    ordering = ['-report_year']

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish CSR report"""
        report = self.get_object()
        report.status = 'PUBLISHED'
        report.published_date = timezone.now().date()
        report.save()
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def generate_annual_report(self, request):
        """Generate annual CSR report"""
        year = request.data.get('report_year')
        
        if not year:
            return Response({'error': 'report_year is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate totals
        total_hours = VolunteerProgram.objects.filter(
            start_date__year=year
        ).aggregate(Sum('actual_hours'))['actual_hours__sum'] or 0
        
        total_beneficiaries = CommunityOutreach.objects.filter(
            start_date__year=year
        ).aggregate(Sum('actual_beneficiaries'))['actual_beneficiaries__sum'] or 0
        
        report = CSRReport.objects.create(
            title=f"CSR & Sustainability Report {year}",
            report_year=year,
            esg_summary="ESG objectives summary",
            environmental_metrics="Environmental performance metrics",
            social_metrics="Social impact metrics",
            governance_metrics="Governance metrics",
            total_volunteer_hours=int(total_hours),
            total_beneficiaries=int(total_beneficiaries),
            created_by=request.user.employee
        )
        
        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
