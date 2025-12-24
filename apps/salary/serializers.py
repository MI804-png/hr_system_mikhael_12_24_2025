from rest_framework import serializers
from .models import Salary, SalaryTransaction, PayrollBatch

class SalaryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryTransaction
        fields = ['id', 'salary', 'transaction_type', 'amount', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    processed_by_name = serializers.StringRelatedField(source='processed_by', read_only=True)
    transactions = SalaryTransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Salary
        fields = [
            'id', 'employee', 'employee_name', 'month', 'year',
            'base_salary', 'working_days', 'actual_working_days',
            'basic_salary', 'allowances', 'gross_salary',
            'income_tax', 'health_insurance', 'social_security',
            'other_deductions', 'total_deductions', 'performance_bonus',
            'net_salary', 'status', 'processed_by', 'processed_by_name',
            'processed_date', 'paid_date', 'notes', 'transactions',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'processed_date', 'paid_date'
        ]

class PayrollBatchSerializer(serializers.ModelSerializer):
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)
    processed_by_name = serializers.StringRelatedField(source='processed_by', read_only=True)
    
    class Meta:
        model = PayrollBatch
        fields = [
            'id', 'month', 'year', 'status', 'total_employees',
            'processed_count', 'total_amount', 'created_by', 'created_by_name',
            'processed_by', 'processed_by_name', 'created_at', 'processed_date'
        ]
        read_only_fields = ['id', 'created_at', 'processed_date']
