from rest_framework import serializers
from .models import (
    CompanyPolicy, PolicyAcknowledgment, DisciplinaryAction,
    ComplianceRecord, AuditLog, LaborLawCompliance, RiskAssessment
)

class CompanyPolicySerializer(serializers.ModelSerializer):
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)
    
    class Meta:
        model = CompanyPolicy
        fields = [
            'id', 'title', 'policy_type', 'description', 'full_text',
            'version', 'effective_date', 'end_date', 'created_by', 'created_by_name', 'is_active'
        ]

class PolicyAcknowledgmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    policy_title = serializers.CharField(source='policy.title', read_only=True)
    
    class Meta:
        model = PolicyAcknowledgment
        fields = ['id', 'employee', 'employee_name', 'policy', 'policy_title', 'acknowledged_date']

class DisciplinaryActionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    issued_by_name = serializers.StringRelatedField(source='issued_by', read_only=True)
    
    class Meta:
        model = DisciplinaryAction
        fields = [
            'id', 'employee', 'employee_name', 'action_type', 'severity',
            'reason', 'description', 'action_date', 'issued_by', 'issued_by_name',
            'effective_date', 'end_date', 'appeal_submitted', 'appeal_date',
            'appeal_outcome', 'documents'
        ]

class ComplianceRecordSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.StringRelatedField(source='assigned_to', read_only=True)
    
    class Meta:
        model = ComplianceRecord
        fields = [
            'id', 'title', 'record_type', 'description', 'status',
            'check_date', 'due_date', 'findings', 'remedial_actions',
            'assigned_to', 'assigned_to_name', 'documents'
        ]

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source='user', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'audit_type', 'user', 'user_name', 'action',
            'description', 'affected_module', 'affected_record_id',
            'old_value', 'new_value', 'ip_address', 'timestamp'
        ]

class LaborLawComplianceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaborLawCompliance
        fields = [
            'id', 'name', 'jurisdiction', 'description', 'requirements',
            'applicable_to_roles', 'last_review_date', 'next_review_date',
            'compliance_status', 'notes'
        ]

class RiskAssessmentSerializer(serializers.ModelSerializer):
    responsible_person_name = serializers.StringRelatedField(source='responsible_person', read_only=True)
    
    class Meta:
        model = RiskAssessment
        fields = [
            'id', 'title', 'description', 'risk_area', 'risk_level',
            'probability', 'impact', 'assessment_date',
            'mitigation_strategy', 'responsible_person', 'responsible_person_name',
            'target_resolution_date', 'status'
        ]
