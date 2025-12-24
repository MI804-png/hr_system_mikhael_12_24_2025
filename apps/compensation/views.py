from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Q
from django.utils import timezone

from .models import (
    SalaryBand, CompensationStructure, EmployeeCompensationPlan,
    IncentivePlan, IncentivePlanEnrollment, MarketAnalysis
)
from .serializers import (
    SalaryBandSerializer, CompensationStructureSerializer, EmployeeCompensationPlanSerializer,
    IncentivePlanSerializer, IncentivePlanEnrollmentSerializer, MarketAnalysisSerializer
)


class SalaryBandViewSet(viewsets.ModelViewSet):
    queryset = SalaryBand.objects.filter(is_active=True)
    serializer_class = SalaryBandSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['job_position', 'level']
    
    @action(detail=False, methods=['get'])
    def by_position(self, request):
        """Get all salary bands for a job position"""
        position_id = request.query_params.get('position_id')
        bands = SalaryBand.objects.filter(job_position_id=position_id, is_active=True)
        return Response(SalaryBandSerializer(bands, many=True).data)


class CompensationStructureViewSet(viewsets.ModelViewSet):
    queryset = CompensationStructure.objects.filter(is_active=True)
    serializer_class = CompensationStructureSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['job_position']


class EmployeeCompensationPlanViewSet(viewsets.ModelViewSet):
    queryset = EmployeeCompensationPlan.objects.all()
    serializer_class = EmployeeCompensationPlanSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_compensation(self, request):
        """Get logged-in employee's compensation plan"""
        try:
            plan = EmployeeCompensationPlan.objects.get(employee=request.user.employee_profile)
            return Response(EmployeeCompensationPlanSerializer(plan).data)
        except EmployeeCompensationPlan.DoesNotExist:
            return Response({'detail': 'No compensation plan found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def update_plan(self, request, pk=None):
        """Update employee compensation plan"""
        plan = self.get_object()
        serializer = self.get_serializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IncentivePlanViewSet(viewsets.ModelViewSet):
    queryset = IncentivePlan.objects.filter(is_active=True)
    serializer_class = IncentivePlanSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plan_type']
    
    @action(detail=False, methods=['get'])
    def active_plans(self, request):
        """Get all active incentive plans"""
        today = timezone.now().date()
        plans = IncentivePlan.objects.filter(
            is_active=True,
            start_date__lte=today
        ).filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
        return Response(IncentivePlanSerializer(plans, many=True).data)


class IncentivePlanEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = IncentivePlanEnrollment.objects.all()
    serializer_class = IncentivePlanEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'plan']
    
    @action(detail=True, methods=['post'])
    def record_performance(self, request, pk=None):
        """Record employee performance for incentive plan"""
        enrollment = self.get_object()
        actual_performance = request.data.get('actual_performance')
        
        if actual_performance:
            enrollment.actual_performance = actual_performance
            # Calculate actual bonus based on performance
            if actual_performance >= enrollment.plan.minimum_performance_threshold:
                bonus_percentage = min(
                    actual_performance * (enrollment.plan.target_incentive_percentage / 100),
                    enrollment.plan.maximum_incentive_percentage
                )
                enrollment.actual_bonus = enrollment.target_bonus * (bonus_percentage / 100)
            else:
                enrollment.actual_bonus = 0
            
            enrollment.save()
        
        return Response(IncentivePlanEnrollmentSerializer(enrollment).data)


class MarketAnalysisViewSet(viewsets.ModelViewSet):
    queryset = MarketAnalysis.objects.all()
    serializer_class = MarketAnalysisSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['job_position', 'location']
    
    @action(detail=False, methods=['get'])
    def latest_by_position(self, request):
        """Get latest market analysis for each position"""
        position_id = request.query_params.get('position_id')
        if position_id:
            analysis = MarketAnalysis.objects.filter(job_position_id=position_id).latest('analysis_date')
            return Response(MarketAnalysisSerializer(analysis).data)
        return Response({'detail': 'position_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """Compare internal salaries with market data"""
        position_id = request.query_params.get('position_id')
        location = request.query_params.get('location')
        
        if not position_id or not location:
            return Response({'detail': 'position_id and location required'}, status=status.HTTP_400_BAD_REQUEST)
        
        market_data = MarketAnalysis.objects.filter(
            job_position_id=position_id,
            location=location
        ).latest('analysis_date')
        
        from apps.employees.models import Employee
        internal_employees = Employee.objects.filter(job_position_id=position_id)
        avg_internal_salary = internal_employees.aggregate(
            avg=Avg('salary')
        )['avg'] or 0
        
        comparison = {
            'market_data': MarketAnalysisSerializer(market_data).data,
            'internal_average': float(avg_internal_salary),
            'market_vs_internal_ratio': float(market_data.market_50th_percentile) / float(avg_internal_salary) if avg_internal_salary > 0 else 0,
        }
        
        return Response(comparison)
