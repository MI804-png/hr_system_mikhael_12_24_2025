from rest_framework import serializers
from .models import (
    BudgetCategory, DepartmentBudget, BudgetAllocation,
    Expenditure, BudgetForecast, BudgetReview
)


class BudgetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetCategory
        fields = '__all__'


class BudgetAllocationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = BudgetAllocation
        fields = '__all__'


class DepartmentBudgetSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    allocations = BudgetAllocationSerializer(many=True, read_only=True)
    
    class Meta:
        model = DepartmentBudget
        fields = '__all__'


class DepartmentBudgetListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = DepartmentBudget
        fields = [
            'id', 'department', 'department_name', 'fiscal_year',
            'fiscal_period', 'period_start', 'period_end', 'total_budget'
        ]


class ExpenditureSerializer(serializers.ModelSerializer):
    allocation_category = serializers.CharField(source='budget_allocation.category.name', read_only=True)
    
    class Meta:
        model = Expenditure
        fields = '__all__'


class BudgetForecastSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = BudgetForecast
        fields = '__all__'


class BudgetReviewSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='budget.department.name', read_only=True)
    
    class Meta:
        model = BudgetReview
        fields = '__all__'
