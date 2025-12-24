from rest_framework import serializers
from .models import (
    RegulationCategory, Regulation, HRPolicy, PolicyAcknowledgment,
    ComplianceTraining, TrainingCompletion, ComplianceAudit,
    ComplianceIncident, ComplianceDashboard
)


class RegulationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RegulationCategory
        fields = ['id', 'name', 'description', 'category_type', 'federal_level', 'is_active', 'created_at']


class RegulationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Regulation
        fields = [
            'id', 'name', 'official_name', 'category', 'category_name',
            'jurisdiction', 'jurisdiction_location', 'description',
            'key_requirements', 'applicable_industries', 'affected_employees',
            'effective_date', 'last_updated', 'status', 'penalty_amount',
            'reference_url', 'created_at', 'updated_at'
        ]


class HRPolicySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    related_regulations = serializers.PrimaryKeyRelatedField(many=True, queryset=Regulation.objects.all())

    class Meta:
        model = HRPolicy
        fields = [
            'id', 'title', 'policy_type', 'description', 'content',
            'related_regulations', 'is_mandatory', 'applies_to',
            'effective_date', 'last_revised_date', 'version',
            'created_by', 'created_by_name', 'status', 'approval_required',
            'created_at', 'updated_at'
        ]


class PolicyAcknowledgmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    policy_title = serializers.CharField(source='policy.title', read_only=True)

    class Meta:
        model = PolicyAcknowledgment
        fields = [
            'id', 'employee', 'employee_name', 'policy', 'policy_title',
            'status', 'acknowledged_date', 'ip_address', 'device_info',
            'notes', 'created_at', 'updated_at'
        ]


class ComplianceTrainingSerializer(serializers.ModelSerializer):
    regulation_name = serializers.CharField(source='regulation.name', read_only=True)
    completions_count = serializers.SerializerMethodField()

    class Meta:
        model = ComplianceTraining
        fields = [
            'id', 'title', 'description', 'regulation', 'regulation_name',
            'requirement_type', 'training_frequency_months', 'duration_minutes',
            'content_url', 'provider', 'is_active', 'completions_count',
            'created_at', 'updated_at'
        ]

    def get_completions_count(self, obj):
        return obj.completions.filter(status='COMPLETED').count()


class TrainingCompletionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    training_title = serializers.CharField(source='training.title', read_only=True)

    class Meta:
        model = TrainingCompletion
        fields = [
            'id', 'employee', 'employee_name', 'training', 'training_title',
            'scheduled_date', 'completion_date', 'status', 'score', 'passed',
            'certificate_url', 'notes', 'next_due_date', 'created_at', 'updated_at'
        ]


class ComplianceAuditSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    auditor_name = serializers.CharField(source='auditor.full_name', read_only=True)
    regulations_audited = serializers.PrimaryKeyRelatedField(many=True, queryset=Regulation.objects.all())

    class Meta:
        model = ComplianceAudit
        fields = [
            'id', 'title', 'department', 'department_name', 'scope',
            'regulations_audited', 'scheduled_date', 'completion_date',
            'status', 'auditor', 'auditor_name', 'findings', 'recommendations',
            'overall_compliance_score', 'follow_up_required', 'follow_up_date',
            'report_url', 'created_at', 'updated_at'
        ]


class ComplianceIncidentSerializer(serializers.ModelSerializer):
    regulation_name = serializers.CharField(source='regulation_violated.name', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.full_name', read_only=True)

    class Meta:
        model = ComplianceIncident
        fields = [
            'id', 'title', 'description', 'violation_type', 'regulation_violated',
            'regulation_name', 'employee', 'employee_name', 'reported_by',
            'reported_by_name', 'reported_date', 'severity', 'status',
            'investigation_notes', 'resolution', 'resolution_date',
            'corrective_actions', 'legal_review_required', 'escalated_to_legal',
            'potential_penalty', 'created_at', 'updated_at'
        ]


class ComplianceDashboardSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    acknowledgment_percentage = serializers.SerializerMethodField()
    training_completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ComplianceDashboard
        fields = [
            'id', 'department', 'department_name', 'total_policies',
            'acknowledged_policies', 'pending_acknowledgments', 'acknowledgment_percentage',
            'required_trainings', 'completed_trainings', 'overdue_trainings',
            'training_completion_percentage', 'open_incidents', 'critical_incidents',
            'audit_compliance_score', 'last_audit_date', 'compliance_status',
            'last_updated'
        ]

    def get_acknowledgment_percentage(self, obj):
        if obj.total_policies == 0:
            return 0
        return round((obj.acknowledged_policies / obj.total_policies) * 100, 2)

    def get_training_completion_percentage(self, obj):
        if obj.required_trainings == 0:
            return 0
        return round((obj.completed_trainings / obj.required_trainings) * 100, 2)
