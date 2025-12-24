from rest_framework import serializers
from .models import (
    WorkforceCostAnalysis, TurnoverAnalysis, HumanCapitalROI,
    StrategicFinancialPlan, FinancialGoal
)


class WorkforceCostAnalysisSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = WorkforceCostAnalysis
        fields = '__all__'


class TurnoverAnalysisSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = TurnoverAnalysis
        fields = '__all__'


class HumanCapitalROISerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    calculated_by_name = serializers.CharField(source='calculated_by.username', read_only=True)
    
    class Meta:
        model = HumanCapitalROI
        fields = '__all__'


class FinancialGoalSerializer(serializers.ModelSerializer):
    responsible_owner_name = serializers.CharField(source='responsible_owner.username', read_only=True)
    
    class Meta:
        model = FinancialGoal
        fields = '__all__'


class StrategicFinancialPlanSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    goals = FinancialGoalSerializer(many=True, read_only=True)
    
    class Meta:
        model = StrategicFinancialPlan
        fields = '__all__'


class StrategicFinancialPlanListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    
    class Meta:
        model = StrategicFinancialPlan
        fields = [
            'id', 'plan_name', 'department', 'department_name', 'planning_horizon',
            'fiscal_year_start', 'status', 'total_projected_investment'
        ]
