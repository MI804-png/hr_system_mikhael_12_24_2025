from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from django.contrib.auth.models import User

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
from .models import Employee, EmployeeBenefits, Leave

class EmployeeBenefitsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeBenefits
        fields = [
            'id', 'employee', 'health_insurance_amount', 'pension_amount',
            'annual_bonus', 'allowances', 'created_at', 'updated_at'
        ]

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    benefits = EmployeeBenefitsSerializer(read_only=True)
    manager_name = serializers.StringRelatedField(source='manager', read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'employee_id', 'department', 'position',
            'employment_type', 'base_salary', 'hire_date', 'manager',
            'manager_name', 'is_active', 'is_on_leave', 'benefits',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    approved_by_name = serializers.StringRelatedField(source='approved_by', read_only=True)
    
    class Meta:
        model = Leave
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'start_date',
            'end_date', 'status', 'reason', 'total_days', 'approved_by',
            'approved_by_name', 'approval_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_days']
