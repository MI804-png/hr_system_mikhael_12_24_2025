from rest_framework import serializers
from django.db.models import Count, Sum

from .models import (
    RetentionRisk, RetentionIntervention, SuccessionPlan, SuccessionCandidate,
    ExitInterview, TurnoverAnalysis, EmployeeEngagement
)


class RetentionRiskSerializer(serializers.ModelSerializer):
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    primary_reason_display = serializers.CharField(source='get_primary_reason_display', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = RetentionRisk
        fields = [
            'id', 'employee', 'employee_name', 'risk_level', 'risk_level_display',
            'primary_reason', 'primary_reason_display', 'risk_score', 'assessment_date',
            'last_review_date', 'description', 'intervention_planned',
            'intervention_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['assessment_date', 'created_at', 'updated_at']


class RetentionInterventionSerializer(serializers.ModelSerializer):
    intervention_type_display = serializers.CharField(source='get_intervention_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = RetentionIntervention
        fields = [
            'id', 'employee', 'employee_name', 'retention_risk', 'intervention_type',
            'intervention_type_display', 'status', 'status_display', 'start_date',
            'end_date', 'description', 'budget', 'owner', 'owner_name',
            'success_criteria', 'outcome', 'was_successful', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SuccessionCandidateSerializer(serializers.ModelSerializer):
    readiness_level_display = serializers.CharField(source='get_readiness_level_display', read_only=True)
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)

    class Meta:
        model = SuccessionCandidate
        fields = [
            'id', 'succession_plan', 'candidate', 'candidate_name', 'readiness_level',
            'readiness_level_display', 'years_in_company', 'years_in_current_role',
            'experience_summary', 'gaps', 'development_plan', 'priority',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SuccessionPlanDetailedSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_employee_name = serializers.CharField(source='current_employee.get_full_name', read_only=True)
    position_name = serializers.CharField(source='position.title', read_only=True)
    succession_candidates = SuccessionCandidateSerializer(source='succession_candidates.all', many=True, read_only=True)

    class Meta:
        model = SuccessionPlan
        fields = [
            'id', 'position', 'position_name', 'current_employee', 'current_employee_name',
            'status', 'status_display', 'estimated_transition_date', 'reason_for_succession',
            'created_date', 'last_reviewed_date', 'transition_plan', 'succession_candidates',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_date', 'created_at', 'updated_at']


class SuccessionPlanSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_employee_name = serializers.CharField(source='current_employee.get_full_name', read_only=True)
    position_name = serializers.CharField(source='position.title', read_only=True)
    candidate_count = serializers.SerializerMethodField()

    class Meta:
        model = SuccessionPlan
        fields = [
            'id', 'position', 'position_name', 'current_employee', 'current_employee_name',
            'status', 'status_display', 'estimated_transition_date', 'reason_for_succession',
            'candidate_count', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_candidate_count(self, obj):
        return obj.succession_candidates.count()


class ExitInterviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    reason_for_leaving_display = serializers.CharField(source='get_reason_for_leaving_display', read_only=True)
    conducted_by_name = serializers.CharField(source='conducted_by.get_full_name', read_only=True)

    class Meta:
        model = ExitInterview
        fields = [
            'id', 'employee', 'employee_name', 'interview_date', 'last_day_of_work',
            'reason_for_leaving', 'reason_for_leaving_display', 'job_satisfaction',
            'management_satisfaction', 'company_culture_fit', 'compensation_adequate',
            'benefits_adequate', 'what_went_well', 'what_could_improve', 'would_recommend',
            'suggestions', 'forwarding_address', 'rehire_eligible', 'notes',
            'conducted_by', 'conducted_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['interview_date', 'created_at', 'updated_at']


class TurnoverAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = TurnoverAnalysis
        fields = [
            'id', 'report_period', 'employees_at_start', 'employees_departed',
            'new_hires', 'employees_at_end', 'turnover_rate', 'voluntary_turnover',
            'involuntary_turnover', 'replacement_cost_per_employee', 'total_replacement_cost',
            'top_departure_reason', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class EmployeeEngagementSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    engagement_trend_display = serializers.CharField(source='get_engagement_trend_display', read_only=True)

    class Meta:
        model = EmployeeEngagement
        fields = [
            'id', 'employee', 'employee_name', 'survey_date', 'job_satisfaction',
            'career_development', 'management_support', 'team_collaboration',
            'work_life_balance', 'company_culture', 'overall_engagement',
            'engagement_trend', 'engagement_trend_display', 'comments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
