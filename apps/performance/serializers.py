from rest_framework import serializers
from apps.performance.models import (
    PerformanceReviewTemplate, PerformanceReview, PerformanceGoal,
    FeedbackRound, FeedbackRequest, DevelopmentPlan, ProductivityMetric
)

class PerformanceReviewTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceReviewTemplate
        fields = ['id', 'name', 'description', 'review_period', 'rating_scale', 'is_active']

class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    reviewer_name = serializers.StringRelatedField(source='reviewer', read_only=True)
    average_rating = serializers.ReadOnlyField()
    
    class Meta:
        model = PerformanceReview
        fields = [
            'id', 'employee', 'employee_name', 'reviewer', 'reviewer_name',
            'review_period_start', 'review_period_end', 'review_date', 'status',
            'job_knowledge', 'quality_of_work', 'productivity', 'teamwork',
            'communication', 'initiative', 'reliability', 'overall_rating',
            'average_rating', 'strengths', 'areas_for_improvement', 'achievements',
            'goals_for_next_period', 'reviewer_comments', 'employee_comments',
            'salary_increase_recommended', 'promotion_recommended',
            'additional_training_needed'
        ]

class PerformanceGoalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    set_by_name = serializers.StringRelatedField(source='set_by', read_only=True)
    
    class Meta:
        model = PerformanceGoal
        fields = [
            'id', 'employee', 'employee_name', 'goal_title', 'description',
            'category', 'priority', 'status', 'start_date', 'due_date',
            'measurable_outcomes', 'progress_percentage', 'set_by', 'set_by_name',
            'completion_date'
        ]

class FeedbackRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackRound
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'is_anonymous']

class FeedbackRequestSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.user.get_full_name', read_only=True)
    provider_name = serializers.StringRelatedField(source='provider', read_only=True)
    
    class Meta:
        model = FeedbackRequest
        fields = [
            'id', 'feedback_round', 'recipient', 'recipient_name', 'provider',
            'provider_name', 'status', 'strengths', 'areas_for_improvement',
            'suggestions', 'rating', 'submitted_date'
        ]

class DevelopmentPlanSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)
    
    class Meta:
        model = DevelopmentPlan
        fields = [
            'id', 'employee', 'employee_name', 'title', 'description',
            'start_date', 'end_date', 'skill_gaps', 'training_needs',
            'development_actions', 'success_measures', 'created_by', 'created_by_name'
        ]

class ProductivityMetricSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    recorded_by_name = serializers.StringRelatedField(source='recorded_by', read_only=True)
    
    class Meta:
        model = ProductivityMetric
        fields = [
            'id', 'employee', 'employee_name', 'metric_date', 'tasks_completed',
            'on_time_delivery_percentage', 'quality_score', 'days_present',
            'days_absent', 'punctuality_score', 'customer_satisfaction',
            'notes', 'recorded_by', 'recorded_by_name'
        ]
