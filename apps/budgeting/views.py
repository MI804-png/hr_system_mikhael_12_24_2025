from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from django.utils import timezone

from .models import (
    BudgetCategory, DepartmentBudget, BudgetAllocation,
    Expenditure, BudgetForecast, BudgetReview
)
from .serializers import (
    BudgetCategorySerializer, DepartmentBudgetSerializer, DepartmentBudgetListSerializer,
    BudgetAllocationSerializer, ExpenditureSerializer, BudgetForecastSerializer, BudgetReviewSerializer
)


class BudgetCategoryViewSet(viewsets.ModelViewSet):
    queryset = BudgetCategory.objects.filter(is_active=True)
    serializer_class = BudgetCategorySerializer
    permission_classes = [IsAuthenticated]


class DepartmentBudgetViewSet(viewsets.ModelViewSet):
    queryset = DepartmentBudget.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'fiscal_year']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DepartmentBudgetListSerializer
        return DepartmentBudgetSerializer
    
    @action(detail=False, methods=['get'])
    def current_budgets(self, request):
        """Get current year budgets"""
        current_year = timezone.now().year
        budgets = DepartmentBudget.objects.filter(fiscal_year=current_year)
        serializer = DepartmentBudgetListSerializer(budgets, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def budget_summary(self, request, pk=None):
        """Get budget summary with spending analysis"""
        budget = self.get_object()
        allocations = budget.allocations.all()
        
        summary = {
            'budget': DepartmentBudgetSerializer(budget).data,
            'allocations': BudgetAllocationSerializer(allocations, many=True).data,
            'total_allocated': allocations.aggregate(total=Sum('allocated_amount'))['total'] or 0,
            'total_spent': allocations.aggregate(total=Sum('actual_spent'))['total'] or 0,
            'utilization_rate': 0,
        }
        
        if summary['total_allocated'] > 0:
            summary['utilization_rate'] = round((summary['total_spent'] / summary['total_allocated']) * 100, 2)
        
        return Response(summary)


class BudgetAllocationViewSet(viewsets.ModelViewSet):
    queryset = BudgetAllocation.objects.all()
    serializer_class = BudgetAllocationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['budget', 'category']


class ExpenditureViewSet(viewsets.ModelViewSet):
    queryset = Expenditure.objects.all()
    serializer_class = ExpenditureSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['budget_allocation', 'status', 'expenditure_type']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve expenditure"""
        expenditure = self.get_object()
        expenditure.status = 'approved'
        expenditure.approved_by = request.user
        expenditure.approved_date = timezone.now()
        expenditure.save()
        return Response(ExpenditureSerializer(expenditure).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject expenditure"""
        expenditure = self.get_object()
        expenditure.status = 'rejected'
        expenditure.save()
        return Response(ExpenditureSerializer(expenditure).data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark expenditure as paid"""
        expenditure = self.get_object()
        expenditure.status = 'paid'
        expenditure.save()
        return Response(ExpenditureSerializer(expenditure).data)
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get expenditures pending approval"""
        expenditures = Expenditure.objects.filter(status='pending')
        serializer = self.get_serializer(expenditures, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def monthly_spending(self, request):
        """Get spending summary by month"""
        year_month = request.query_params.get('period')  # YYYY-MM
        
        expenditures = Expenditure.objects.filter(status='paid')
        if year_month:
            expenditures = expenditures.filter(expense_date__startswith=year_month)
        
        summary = expenditures.aggregate(
            total_spent=Sum('amount'),
            count=Count('id')
        )
        return Response(summary)


class BudgetForecastViewSet(viewsets.ModelViewSet):
    queryset = BudgetForecast.objects.all()
    serializer_class = BudgetForecastSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['budget', 'category']


class BudgetReviewViewSet(viewsets.ModelViewSet):
    queryset = BudgetReview.objects.all()
    serializer_class = BudgetReviewSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['budget', 'status']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve budget review"""
        review = self.get_object()
        review.status = 'approved'
        review.approved_by = request.user
        review.save()
        return Response(BudgetReviewSerializer(review).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject budget review"""
        review = self.get_object()
        review.status = 'rejected'
        review.save()
        return Response(BudgetReviewSerializer(review).data)
