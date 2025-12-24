from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from datetime import datetime, timedelta

from .models import (
    RetentionRisk, RetentionIntervention, SuccessionPlan, SuccessionCandidate,
    ExitInterview, TurnoverAnalysis, EmployeeEngagement
)
from .serializers import (
    RetentionRiskSerializer, RetentionInterventionSerializer, SuccessionPlanSerializer,
    SuccessionPlanDetailedSerializer, SuccessionCandidateSerializer, ExitInterviewSerializer,
    TurnoverAnalysisSerializer, EmployeeEngagementSerializer
)


class RetentionRiskViewSet(viewsets.ModelViewSet):
    """Identify and manage employee retention risks"""
    queryset = RetentionRisk.objects.all()
    serializer_class = RetentionRiskSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['risk_level', 'primary_reason']
    ordering_fields = ['risk_score', 'assessment_date']
    ordering = ['-risk_score']

    @action(detail=True, methods=['post'])
    def assess_risk(self, request, pk=None):
        """Update risk assessment"""
        risk = self.get_object()
        risk_score = request.data.get('risk_score')
        risk_level = request.data.get('risk_level')
        
        if risk_score is not None:
            risk.risk_score = risk_score
        if risk_level:
            risk.risk_level = risk_level
        
        risk.last_review_date = timezone.now().date()
        risk.save()
        
        serializer = self.get_serializer(risk)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def high_risk_employees(self, request):
        """Get all high and critical risk employees"""
        risks = RetentionRisk.objects.filter(risk_level__in=['HIGH', 'CRITICAL'])
        serializer = self.get_serializer(risks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def risk_summary(self, request):
        """Get risk summary statistics"""
        total_employees = RetentionRisk.objects.count()
        critical = RetentionRisk.objects.filter(risk_level='CRITICAL').count()
        high = RetentionRisk.objects.filter(risk_level='HIGH').count()
        medium = RetentionRisk.objects.filter(risk_level='MEDIUM').count()
        low = RetentionRisk.objects.filter(risk_level='LOW').count()
        
        avg_risk_score = RetentionRisk.objects.aggregate(Avg('risk_score'))['risk_score__avg'] or 0
        
        return Response({
            'total_employees_assessed': total_employees,
            'critical_risk': critical,
            'high_risk': high,
            'medium_risk': medium,
            'low_risk': low,
            'average_risk_score': round(avg_risk_score, 2)
        })


class RetentionInterventionViewSet(viewsets.ModelViewSet):
    """Manage retention improvement interventions"""
    queryset = RetentionIntervention.objects.all()
    serializer_class = RetentionInterventionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'intervention_type', 'status']
    ordering_fields = ['start_date', 'budget']
    ordering = ['-start_date']

    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """Mark intervention as complete"""
        intervention = self.get_object()
        intervention.status = 'COMPLETED'
        intervention.end_date = timezone.now().date()
        intervention.was_successful = request.data.get('was_successful', False)
        intervention.outcome = request.data.get('outcome', '')
        intervention.save()
        
        serializer = self.get_serializer(intervention)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_interventions(self, request):
        """Get all active interventions"""
        interventions = RetentionIntervention.objects.filter(status='IN_PROGRESS')
        serializer = self.get_serializer(interventions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def intervention_effectiveness(self, request):
        """Analyze intervention effectiveness"""
        completed = RetentionIntervention.objects.filter(status='COMPLETED')
        total = completed.count()
        successful = completed.filter(was_successful=True).count()
        
        effectiveness = (successful / total * 100) if total > 0 else 0
        
        # By type
        by_type = {}
        for intervention in completed:
            itype = intervention.get_intervention_type_display()
            if itype not in by_type:
                by_type[itype] = {'total': 0, 'successful': 0}
            by_type[itype]['total'] += 1
            if intervention.was_successful:
                by_type[itype]['successful'] += 1
        
        for itype in by_type:
            by_type[itype]['effectiveness'] = round(
                by_type[itype]['successful'] / by_type[itype]['total'] * 100,
                1
            )
        
        return Response({
            'overall_effectiveness': round(effectiveness, 1),
            'total_completed': total,
            'successful_interventions': successful,
            'by_type': by_type
        })


class SuccessionPlanViewSet(viewsets.ModelViewSet):
    """Manage succession plans for critical roles"""
    queryset = SuccessionPlan.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'position']
    ordering_fields = ['estimated_transition_date']
    ordering = ['estimated_transition_date']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SuccessionPlanDetailedSerializer
        return SuccessionPlanSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve succession plan"""
        plan = self.get_object()
        plan.status = 'APPROVED'
        plan.last_reviewed_date = timezone.now().date()
        plan.save()
        
        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate succession plan"""
        plan = self.get_object()
        plan.status = 'ACTIVE'
        plan.save()
        
        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete succession plan"""
        plan = self.get_object()
        plan.status = 'COMPLETED'
        plan.save()
        
        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_transitions(self, request):
        """Get succession plans with upcoming transitions"""
        today = timezone.now().date()
        future = today + timedelta(days=180)
        
        plans = SuccessionPlan.objects.filter(
            estimated_transition_date__range=[today, future],
            status__in=['APPROVED', 'ACTIVE']
        ).order_by('estimated_transition_date')
        
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def readiness_dashboard(self, request):
        """Succession readiness dashboard"""
        plans = SuccessionPlan.objects.filter(status__in=['ACTIVE', 'APPROVED'])
        
        ready_count = SuccessionCandidate.objects.filter(
            succession_plan__in=plans,
            readiness_level='READY'
        ).values('succession_plan').distinct().count()
        
        total_plans = plans.count()
        
        return Response({
            'total_succession_plans': total_plans,
            'plans_with_ready_successors': ready_count,
            'coverage_percentage': round((ready_count / total_plans * 100) if total_plans > 0 else 0, 1)
        })


class SuccessionCandidateViewSet(viewsets.ModelViewSet):
    """Manage succession candidates"""
    queryset = SuccessionCandidate.objects.all()
    serializer_class = SuccessionCandidateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['succession_plan', 'readiness_level']
    ordering_fields = ['priority', 'readiness_level']
    ordering = ['priority']

    @action(detail=True, methods=['post'])
    def update_readiness(self, request, pk=None):
        """Update candidate readiness level"""
        candidate = self.get_object()
        readiness = request.data.get('readiness_level')
        
        if readiness:
            candidate.readiness_level = readiness
            candidate.save()
        
        serializer = self.get_serializer(candidate)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_development_plan(self, request, pk=None):
        """Update development plan"""
        candidate = self.get_object()
        candidate.gaps = request.data.get('gaps', candidate.gaps)
        candidate.development_plan = request.data.get('development_plan', candidate.development_plan)
        candidate.save()
        
        serializer = self.get_serializer(candidate)
        return Response(serializer.data)


class ExitInterviewViewSet(viewsets.ModelViewSet):
    """Manage exit interviews"""
    queryset = ExitInterview.objects.all()
    serializer_class = ExitInterviewSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['reason_for_leaving']
    ordering_fields = ['interview_date']
    ordering = ['-interview_date']

    @action(detail=False, methods=['get'])
    def departure_analysis(self, request):
        """Analyze departure reasons"""
        interviews = ExitInterview.objects.all()
        
        reasons = {}
        for interview in interviews:
            reason = interview.get_reason_for_leaving_display()
            reasons[reason] = reasons.get(reason, 0) + 1
        
        avg_satisfaction = interviews.aggregate(Avg('job_satisfaction'))['job_satisfaction__avg'] or 0
        avg_management = interviews.aggregate(Avg('management_satisfaction'))['management_satisfaction__avg'] or 0
        avg_culture = interviews.aggregate(Avg('company_culture_fit'))['company_culture_fit__avg'] or 0
        
        would_recommend = interviews.filter(would_recommend=True).count()
        rehire_eligible = interviews.filter(rehire_eligible=True).count()
        
        return Response({
            'total_interviews': interviews.count(),
            'departure_reasons': reasons,
            'avg_job_satisfaction': round(avg_satisfaction, 1),
            'avg_management_satisfaction': round(avg_management, 1),
            'avg_culture_fit': round(avg_culture, 1),
            'would_recommend_company': would_recommend,
            'rehire_eligible': rehire_eligible
        })


class TurnoverAnalysisViewSet(viewsets.ModelViewSet):
    """Analyze turnover trends"""
    queryset = TurnoverAnalysis.objects.all()
    serializer_class = TurnoverAnalysisSerializer
    permission_classes = [IsAuthenticated]
    ordering_fields = ['report_period']
    ordering = ['-report_period']

    @action(detail=False, methods=['post'])
    def generate_report(self, request):
        """Generate turnover analysis report"""
        period = request.data.get('report_period')
        employees_at_start = request.data.get('employees_at_start', 0)
        employees_departed = request.data.get('employees_departed', 0)
        new_hires = request.data.get('new_hires', 0)
        
        employees_at_end = employees_at_start - employees_departed + new_hires
        turnover_rate = (employees_departed / employees_at_start * 100) if employees_at_start > 0 else 0
        
        analysis = TurnoverAnalysis.objects.create(
            report_period=period,
            employees_at_start=employees_at_start,
            employees_departed=employees_departed,
            new_hires=new_hires,
            employees_at_end=employees_at_end,
            turnover_rate=turnover_rate,
            voluntary_turnover=request.data.get('voluntary_turnover', 0),
            involuntary_turnover=request.data.get('involuntary_turnover', 0)
        )
        
        serializer = self.get_serializer(analysis)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get turnover trends"""
        analyses = TurnoverAnalysis.objects.all().order_by('report_period')
        
        periods = [a.report_period for a in analyses]
        rates = [float(a.turnover_rate) for a in analyses]
        
        return Response({
            'periods': periods,
            'turnover_rates': rates,
            'latest_rate': rates[-1] if rates else 0
        })


class EmployeeEngagementViewSet(viewsets.ModelViewSet):
    """Track employee engagement scores"""
    queryset = EmployeeEngagement.objects.all()
    serializer_class = EmployeeEngagementSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'engagement_trend']
    ordering_fields = ['survey_date', 'overall_engagement']
    ordering = ['-survey_date']

    @action(detail=False, methods=['get'])
    def engagement_dashboard(self, request):
        """Get engagement metrics dashboard"""
        latest_surveys = EmployeeEngagement.objects.all().order_by('employee', '-survey_date').distinct('employee')
        
        avg_overall = latest_surveys.aggregate(Avg('overall_engagement'))['overall_engagement__avg'] or 0
        avg_job_satisfaction = latest_surveys.aggregate(Avg('job_satisfaction'))['job_satisfaction__avg'] or 0
        avg_career = latest_surveys.aggregate(Avg('career_development'))['career_development__avg'] or 0
        avg_management = latest_surveys.aggregate(Avg('management_support'))['management_support__avg'] or 0
        avg_balance = latest_surveys.aggregate(Avg('work_life_balance'))['work_life_balance__avg'] or 0
        
        improving = latest_surveys.filter(engagement_trend='IMPROVING').count()
        declining = latest_surveys.filter(engagement_trend='DECLINING').count()
        
        return Response({
            'avg_overall_engagement': round(avg_overall, 1),
            'avg_job_satisfaction': round(avg_job_satisfaction, 1),
            'avg_career_development': round(avg_career, 1),
            'avg_management_support': round(avg_management, 1),
            'avg_work_life_balance': round(avg_balance, 1),
            'employees_with_improving_engagement': improving,
            'employees_with_declining_engagement': declining
        })

    @action(detail=False, methods=['get'])
    def at_risk_engagement(self, request):
        """Get employees with declining engagement"""
        at_risk = EmployeeEngagement.objects.filter(
            engagement_trend='DECLINING',
            overall_engagement__lt=6
        ).select_related('employee').order_by('-overall_engagement')
        
        serializer = self.get_serializer(at_risk, many=True)
        return Response(serializer.data)
