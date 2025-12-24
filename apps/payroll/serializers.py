from rest_framework import serializers
from .models import (
    PayrollPeriod, TaxConfiguration, Deduction, PayCheck, 
    PayrollDeduction, TimesheetEntry, Bonus, Raise, PayrollReport
)


class PayrollPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollPeriod
        fields = '__all__'


class TaxConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxConfiguration
        fields = '__all__'


class DeductionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    
    class Meta:
        model = Deduction
        fields = '__all__'


class PayrollDeductionSerializer(serializers.ModelSerializer):
    deduction_type = serializers.CharField(source='deduction.get_deduction_type_display', read_only=True)
    
    class Meta:
        model = PayrollDeduction
        fields = '__all__'


class PayCheckDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    deduction_items = PayrollDeductionSerializer(many=True, read_only=True)
    
    class Meta:
        model = PayCheck
        fields = '__all__'


class PayCheckSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    
    class Meta:
        model = PayCheck
        fields = [
            'id', 'employee', 'employee_name', 'payroll_period',
            'gross_pay', 'total_deductions', 'net_pay', 'status', 'payment_date'
        ]


class TimesheetEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    
    class Meta:
        model = TimesheetEntry
        fields = '__all__'


class BonusSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    bonus_type_display = serializers.CharField(source='get_bonus_type_display', read_only=True)
    
    class Meta:
        model = Bonus
        fields = '__all__'


class RaiseSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    
    class Meta:
        model = Raise
        fields = '__all__'


class PayrollReportSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    
    class Meta:
        model = PayrollReport
        fields = '__all__'
