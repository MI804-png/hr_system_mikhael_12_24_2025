from rest_framework import serializers
from .models import (
    SalaryBand, CompensationStructure, EmployeeCompensationPlan,
    IncentivePlan, IncentivePlanEnrollment, MarketAnalysis
)


class SalaryBandSerializer(serializers.ModelSerializer):
    job_position_title = serializers.CharField(source='job_position.title', read_only=True)
    
    class Meta:
        model = SalaryBand
        fields = '__all__'


class CompensationStructureSerializer(serializers.ModelSerializer):
    job_position_title = serializers.CharField(source='job_position.title', read_only=True)
    
    class Meta:
        model = CompensationStructure
        fields = '__all__'


class EmployeeCompensationPlanSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    job_title = serializers.CharField(source='employee.job_position.title', read_only=True)
    
    class Meta:
        model = EmployeeCompensationPlan
        fields = '__all__'


class IncentivePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncentivePlan
        fields = '__all__'


class IncentivePlanEnrollmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = IncentivePlanEnrollment
        fields = '__all__'


class MarketAnalysisSerializer(serializers.ModelSerializer):
    job_position_title = serializers.CharField(source='job_position.title', read_only=True)
    
    class Meta:
        model = MarketAnalysis
        fields = '__all__'
