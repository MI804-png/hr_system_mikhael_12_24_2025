from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone

from .models import (
    WorkforceCostAnalysis, TurnoverAnalysis, HumanCapitalROI,
    StrategicFinancialPlan, FinancialGoal
)
from .serializers import (
    WorkforceCostAnalysisSerializer, TurnoverAnalysisSerializer, HumanCapitalROISerializer,
    StrategicFinancialPlanSerializer, StrategicFinancialPlanListSerializer, FinancialGoalSerializer
)


class WorkforceCostAnalysisViewSet(viewsets.ModelViewSet):
    queryset = WorkforceCostAnalysis.objects.all()
    serializer_class = WorkforceCostAnalysisSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'analysis_date']
    
    @action(detail=False, methods=['get'])
    def latest_by_department(self, request):
        """Get latest cost analysis for each department"""
        department_id = request.query_params.get('department_id')
        if department_id:
            analysis = WorkforceCostAnalysis.objects.filter(
                department_id=department_id
            ).latest('analysis_date')
            return Response(WorkforceCostAnalysisSerializer(analysis).data)
        return Response({'detail': 'department_id required'}, status=status.HTTP_400_BAD_REQUEST)


class TurnoverAnalysisViewSet(viewsets.ModelViewSet):
    queryset = TurnoverAnalysis.objects.all()
    serializer_class = TurnoverAnalysisSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'analysis_period']
    
    @action(detail=False, methods=['get'])
    def high_turnover(self, request):
        """Get departments with high turnover rates"""
        threshold = float(request.query_params.get('threshold', 15))  # Default 15%
        analyses = TurnoverAnalysis.objects.filter(turnover_rate__gte=threshold)
        return Response(TurnoverAnalysisSerializer(analyses, many=True).data)
    
    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """Compare turnover across departments"""
        period = request.query_params.get('period')
        if period:
            analyses = TurnoverAnalysis.objects.filter(analysis_period=period)
            return Response(TurnoverAnalysisSerializer(analyses, many=True).data)
        return Response({'detail': 'period required'}, status=status.HTTP_400_BAD_REQUEST)


class HumanCapitalROIViewSet(viewsets.ModelViewSet):
    queryset = HumanCapitalROI.objects.all()
    serializer_class = HumanCapitalROISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department']
    
    @action(detail=False, methods=['get'])
    def positive_roi(self, request):
        """Get investments with positive ROI"""
        roi_calcs = HumanCapitalROI.objects.filter(roi_percentage__gte=0)
        return Response(HumanCapitalROISerializer(roi_calcs, many=True).data)
    
    @action(detail=False, methods=['get'])
    def best_performing(self, request):
        """Get best performing human capital investments"""
        roi_calcs = HumanCapitalROI.objects.all().order_by('-roi_percentage')[:5]
        return Response(HumanCapitalROISerializer(roi_calcs, many=True).data)


class FinancialGoalViewSet(viewsets.ModelViewSet):
    queryset = FinancialGoal.objects.all()
    serializer_class = FinancialGoalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plan', 'status', 'category']
    
    @action(detail=False, methods=['get'])
    def at_risk(self, request):
        """Get financial goals at risk"""
        goals = FinancialGoal.objects.filter(status='at_risk')
        return Response(FinancialGoalSerializer(goals, many=True).data)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update goal progress"""
        goal = self.get_object()
        goal.current_value = request.data.get('current_value', goal.current_value)
        goal.progress_percentage = request.data.get('progress_percentage', goal.progress_percentage)
        goal.status = request.data.get('status', goal.status)
        goal.save()
        return Response(FinancialGoalSerializer(goal).data)


class StrategicFinancialPlanViewSet(viewsets.ModelViewSet):
    queryset = StrategicFinancialPlan.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'fiscal_year_start']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StrategicFinancialPlanListSerializer
        return StrategicFinancialPlanSerializer
    
    @action(detail=False, methods=['get'])
    def active_plans(self, request):
        """Get all active financial plans"""
        plans = StrategicFinancialPlan.objects.filter(status__in=['approved', 'active'])
        serializer = StrategicFinancialPlanListSerializer(plans, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve strategic financial plan"""
        plan = self.get_object()
        plan.status = 'approved'
        plan.approved_by = request.user
        plan.approval_date = timezone.now().date()
        plan.save()
        return Response(StrategicFinancialPlanSerializer(plan).data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a financial plan"""
        plan = self.get_object()
        if plan.status != 'approved':
            return Response(
                {'detail': 'Only approved plans can be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        plan.status = 'active'
        plan.save()
        return Response(StrategicFinancialPlanSerializer(plan).data)
    
    @action(detail=True, methods=['get'])
    def plan_summary(self, request, pk=None):
        """Get comprehensive plan summary with goals"""
        plan = self.get_object()
        goals = plan.goals.all()
        
        summary = {
            'plan': StrategicFinancialPlanSerializer(plan).data,
            'goals': FinancialGoalSerializer(goals, many=True).data,
            'goals_on_track': goals.filter(status='on_track').count(),
            'goals_at_risk': goals.filter(status='at_risk').count(),
            'goals_completed': goals.filter(status='completed').count(),
            'overall_progress': goals.aggregate(avg_progress=Avg('progress_percentage'))['avg_progress'] or 0,
        }
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get financial planning dashboard"""
        active_plans = StrategicFinancialPlan.objects.filter(status='active')
        
        total_investment = active_plans.aggregate(total=Sum('total_projected_investment'))['total'] or 0
        total_expected_roi = active_plans.aggregate(total=Sum('expected_roi'))['total'] or 0
        
        pending_goals = FinancialGoal.objects.filter(status__in=['planned', 'in_progress'])
        at_risk_goals = FinancialGoal.objects.filter(status='at_risk')
        completed_goals = FinancialGoal.objects.filter(status='completed')
        
        dashboard = {
            'active_plans': active_plans.count(),
            'total_investment': float(total_investment),
            'total_expected_roi': float(total_expected_roi),
            'pending_goals': pending_goals.count(),
            'at_risk_goals': at_risk_goals.count(),
            'completed_goals': completed_goals.count(),
            'overall_goal_progress': FinancialGoal.objects.aggregate(
                avg=Avg('progress_percentage')
            )['avg'] or 0,
        }
        
        return Response(dashboard)
