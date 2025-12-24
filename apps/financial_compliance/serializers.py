from rest_framework import serializers
from .models import (
    FinancialAuditLog, ComplianceRecord, TaxFilingRecord,
    FinancialRiskAssessment, TerminationFinancials
)


class FinancialAuditLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = FinancialAuditLog
        fields = '__all__'


class ComplianceRecordSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    compliance_type_display = serializers.CharField(source='get_compliance_type_display', read_only=True)
    
    class Meta:
        model = ComplianceRecord
        fields = '__all__'


class TaxFilingRecordSerializer(serializers.ModelSerializer):
    filed_by_name = serializers.CharField(source='filed_by.username', read_only=True)
    filing_type_display = serializers.CharField(source='get_filing_type_display', read_only=True)
    
    class Meta:
        model = TaxFilingRecord
        fields = '__all__'


class FinancialRiskAssessmentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    mitigation_owner_name = serializers.CharField(source='mitigation_owner.username', read_only=True, allow_null=True)
    
    class Meta:
        model = FinancialRiskAssessment
        fields = '__all__'


class TerminationFinancialsSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = TerminationFinancials
        fields = '__all__'
