from rest_framework import serializers
from .models import (
    BenefitType, BenefitPackage, HealthInsurance, RetirementPlan,
    EmployeeBenefitEnrollment, HealthInsuranceEnrollment, RetirementPlanEnrollment,
    Reimbursement, WellnessProgram, WellnessProgramParticipation
)

class BenefitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BenefitType
        fields = ['id', 'name', 'type', 'description', 'is_active']

class BenefitPackageSerializer(serializers.ModelSerializer):
    benefits_detail = BenefitTypeSerializer(source='benefits', many=True, read_only=True)
    
    class Meta:
        model = BenefitPackage
        fields = ['id', 'name', 'description', 'benefits', 'benefits_detail', 'monthly_cost', 'annual_limit', 'is_active']

class HealthInsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthInsurance
        fields = [
            'id', 'plan_name', 'plan_type', 'provider', 'description',
            'coverage_details', 'employee_premium', 'employer_contribution',
            'deductible', 'out_of_pocket_max', 'effective_date', 'end_date', 'is_active'
        ]

class RetirementPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetirementPlan
        fields = [
            'id', 'plan_name', 'plan_type', 'provider', 'description',
            'employee_contribution_max', 'employer_match_percentage',
            'employer_match_max', 'vesting_schedule', 'effective_date', 'end_date', 'is_active'
        ]

class EmployeeBenefitEnrollmentSerializer(serializers.ModelSerializer):
    benefit_package_name = serializers.CharField(source='benefit_package.name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = EmployeeBenefitEnrollment
        fields = [
            'id', 'employee', 'employee_name', 'benefit_package', 'benefit_package_name',
            'status', 'enrollment_date', 'effective_date', 'end_date', 'monthly_deduction'
        ]

class HealthInsuranceEnrollmentSerializer(serializers.ModelSerializer):
    insurance_plan_name = serializers.CharField(source='insurance_plan.plan_name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = HealthInsuranceEnrollment
        fields = [
            'id', 'employee', 'employee_name', 'insurance_plan', 'insurance_plan_name',
            'status', 'enrollment_date', 'effective_date', 'termination_date',
            'dependents', 'coverage_type', 'monthly_premium'
        ]

class RetirementPlanEnrollmentSerializer(serializers.ModelSerializer):
    retirement_plan_name = serializers.CharField(source='retirement_plan.plan_name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = RetirementPlanEnrollment
        fields = [
            'id', 'employee', 'employee_name', 'retirement_plan', 'retirement_plan_name',
            'enrollment_date', 'effective_date', 'termination_date',
            'employee_contribution_percentage', 'employer_match_percentage',
            'account_balance', 'last_contribution_date'
        ]

class ReimbursementSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    approved_by_name = serializers.StringRelatedField(source='approved_by', read_only=True)
    
    class Meta:
        model = Reimbursement
        fields = [
            'id', 'employee', 'employee_name', 'category', 'description', 'amount',
            'expense_date', 'submission_date', 'receipt', 'status',
            'approved_by', 'approved_by_name', 'approval_date', 'rejection_reason',
            'paid_date', 'notes'
        ]
        read_only_fields = ['id', 'submission_date']

class WellnessProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = WellnessProgram
        fields = [
            'id', 'name', 'description', 'type', 'provider', 'cost_per_employee',
            'max_annual_benefit', 'start_date', 'end_date', 'is_active'
        ]

class WellnessProgramParticipationSerializer(serializers.ModelSerializer):
    wellness_program_name = serializers.CharField(source='wellness_program.name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = WellnessProgramParticipation
        fields = [
            'id', 'employee', 'employee_name', 'wellness_program', 'wellness_program_name',
            'enrollment_date', 'exit_date', 'is_active'
        ]
