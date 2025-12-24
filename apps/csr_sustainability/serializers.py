from rest_framework import serializers
from django.db.models import Sum, Count, F
from decimal import Decimal

from .models import (
    ESGObjective, VolunteerProgram, EmployeeVolunteerLog, SustainabilityInitiative,
    DiversityMetric, CommunityOutreach, CSRReport
)


class ESGObjectiveSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = ESGObjective
        fields = [
            'id', 'category', 'category_display', 'priority', 'title', 'description',
            'target_value', 'target_unit', 'current_value', 'progress_percentage',
            'start_date', 'target_date', 'owner', 'owner_name', 'status', 'status_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['progress_percentage', 'created_at', 'updated_at']


class EmployeeVolunteerLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = EmployeeVolunteerLog
        fields = [
            'id', 'volunteer_program', 'employee', 'employee_name', 'volunteer_date',
            'hours', 'activities', 'approved', 'approved_by', 'approved_by_name',
            'approved_date', 'created_at'
        ]
        read_only_fields = ['created_at']


class VolunteerProgramDetailedSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    volunteer_logs = EmployeeVolunteerLogSerializer(source='volunteer_logs.all', many=True, read_only=True)
    hours_remaining = serializers.ReadOnlyField()
    participation_rate = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerProgram
        fields = [
            'id', 'name', 'description', 'cause_area', 'status', 'status_display',
            'start_date', 'end_date', 'target_hours', 'actual_hours', 'hours_remaining',
            'participation_rate', 'partner_organization', 'impact_description',
            'manager', 'manager_name', 'participant_count', 'volunteer_logs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['actual_hours', 'created_at', 'updated_at']

    def get_participant_count(self, obj):
        return obj.participating_employees.count()


class VolunteerProgramSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hours_remaining = serializers.ReadOnlyField()
    participation_rate = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerProgram
        fields = [
            'id', 'name', 'cause_area', 'status', 'status_display', 'start_date',
            'target_hours', 'actual_hours', 'hours_remaining', 'participation_rate',
            'participant_count', 'created_at'
        ]
        read_only_fields = ['actual_hours', 'created_at']

    def get_participant_count(self, obj):
        return obj.participating_employees.count()


class SustainabilityInitiativeSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reduction_percentage_achieved = serializers.ReadOnlyField()
    budget_utilization = serializers.ReadOnlyField()
    department_count = serializers.SerializerMethodField()

    class Meta:
        model = SustainabilityInitiative
        fields = [
            'id', 'name', 'description', 'initiative_type', 'status', 'status_display',
            'start_date', 'end_date', 'baseline_value', 'baseline_unit',
            'target_reduction_percentage', 'current_value', 'reduction_percentage_achieved',
            'budget_allocated', 'budget_spent', 'budget_utilization', 'owner', 'owner_name',
            'department_count', 'expected_impact', 'actual_impact', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reduction_percentage_achieved', 'budget_utilization', 'created_at', 'updated_at']

    def get_department_count(self, obj):
        return obj.departments.count()


class DiversityMetricSerializer(serializers.ModelSerializer):
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)

    class Meta:
        model = DiversityMetric
        fields = [
            'id', 'metric_type', 'metric_type_display', 'report_date', 'category',
            'count', 'percentage', 'target_percentage', 'created_at'
        ]
        read_only_fields = ['created_at']


class CommunityOutreachSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    beneficiary_reach = serializers.ReadOnlyField()

    class Meta:
        model = CommunityOutreach
        fields = [
            'id', 'name', 'description', 'community_focus', 'status', 'status_display',
            'start_date', 'end_date', 'target_beneficiaries', 'actual_beneficiaries',
            'beneficiary_reach', 'budget_allocated', 'budget_spent', 'partner_organizations',
            'manager', 'manager_name', 'outcomes_description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['actual_beneficiaries', 'beneficiary_reach', 'created_at', 'updated_at']


class CSRReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CSRReport
        fields = [
            'id', 'title', 'report_year', 'status', 'status_display', 'esg_summary',
            'environmental_metrics', 'social_metrics', 'governance_metrics',
            'total_volunteer_hours', 'total_beneficiaries', 'carbon_footprint_reduction',
            'created_by', 'created_by_name', 'created_date', 'published_date',
            'report_file_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_date', 'created_at', 'updated_at']
