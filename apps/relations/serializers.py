from rest_framework import serializers
from apps.relations.models import (
    Grievance, GrievanceFollowUp, ConflictMediation,
    EmployeeEngagement, ExitInterview, WorkplaceEnvironment
)

class GrievanceFollowUpSerializer(serializers.ModelSerializer):
    added_by_name = serializers.StringRelatedField(source='added_by', read_only=True)
    
    class Meta:
        model = GrievanceFollowUp
        fields = ['id', 'grievance', 'notes', 'follow_up_date', 'action_taken', 'next_steps', 'added_by', 'added_by_name', 'created_at']

class GrievanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    assigned_to_name = serializers.StringRelatedField(source='assigned_to', read_only=True)
    follow_ups = GrievanceFollowUpSerializer(many=True, read_only=True)
    
    class Meta:
        model = Grievance
        fields = [
            'id', 'employee', 'employee_name', 'category', 'title', 'description',
            'involved_parties', 'incident_date', 'status', 'filed_date', 'assigned_to',
            'assigned_to_name', 'resolution', 'resolution_date', 'documents', 'follow_ups'
        ]

class ConflictMediationSerializer(serializers.ModelSerializer):
    mediator_name = serializers.StringRelatedField(source='mediator', read_only=True)
    grievance_title = serializers.CharField(source='grievance.title', read_only=True)
    
    class Meta:
        model = ConflictMediation
        fields = [
            'id', 'grievance', 'grievance_title', 'mediator', 'mediator_name',
            'status', 'scheduled_date', 'mediation_date', 'location',
            'notes_from_session', 'agreement_summary', 'follow_up_required', 'follow_up_date'
        ]

class EmployeeEngagementSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = EmployeeEngagement
        fields = [
            'id', 'employee', 'employee_name', 'job_satisfaction', 'work_life_balance',
            'team_collaboration', 'management_trust', 'career_growth_opportunity',
            'survey_date', 'overall_engagement_score', 'feedback'
        ]

class ExitInterviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    conducted_by_name = serializers.StringRelatedField(source='conducted_by', read_only=True)
    
    class Meta:
        model = ExitInterview
        fields = [
            'id', 'employee', 'employee_name', 'interview_date', 'last_working_day',
            'position_held', 'tenure_years', 'reason_for_leaving', 'detailed_reason',
            'would_recommend', 'recommendation_reason', 'suggestions_for_improvement',
            'conducted_by', 'conducted_by_name'
        ]

class WorkplaceEnvironmentSerializer(serializers.ModelSerializer):
    assessed_by_name = serializers.StringRelatedField(source='assessed_by', read_only=True)
    
    class Meta:
        model = WorkplaceEnvironment
        fields = [
            'id', 'department', 'cleanliness', 'safety', 'equipment_condition',
            'noise_level', 'temperature_control', 'assessment_date', 'assessed_by',
            'assessed_by_name', 'notes', 'improvement_actions'
        ]
