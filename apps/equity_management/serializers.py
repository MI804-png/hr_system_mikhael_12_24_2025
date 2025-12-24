from rest_framework import serializers
from django.db.models import Q, F, Sum
from decimal import Decimal

from .models import (
    StockOptionPlan, EquityGrant, VestingSchedule, EquityExercise,
    ESOP, ESOPParticipant, EquityReport
)
from apps.employees.models import Employee


class StockOptionPlanSerializer(serializers.ModelSerializer):
    shares_available = serializers.SerializerMethodField()
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)

    class Meta:
        model = StockOptionPlan
        fields = [
            'id', 'name', 'plan_type', 'plan_type_display', 'description',
            'strike_price', 'shares_authorized', 'shares_issued', 'shares_available',
            'exercise_window_years', 'tax_treatment', 'start_date', 'end_date',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['shares_issued', 'created_at', 'updated_at']

    def get_shares_available(self, obj):
        return obj.shares_available


class VestingScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VestingSchedule
        fields = [
            'id', 'vesting_date', 'shares_to_vest', 'is_vested',
            'vested_date', 'created_at'
        ]
        read_only_fields = ['created_at']


class EquityExerciseSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = EquityExercise
        fields = [
            'id', 'grant', 'exercise_date', 'shares_exercised', 'exercise_price',
            'total_cost', 'exercise_method', 'status', 'status_display',
            'approved_by', 'approved_by_name', 'approved_date', 'completed_date',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_cost', 'created_at', 'updated_at']


class EquityGrantDetailedSerializer(serializers.ModelSerializer):
    vesting_events = VestingScheduleSerializer(source='vesting_events.all', many=True, read_only=True)
    exercises = EquityExerciseSerializer(source='exercises.all', many=True, read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    shares_available_to_exercise = serializers.ReadOnlyField()
    vesting_percentage = serializers.ReadOnlyField()

    class Meta:
        model = EquityGrant
        fields = [
            'id', 'grant_number', 'employee', 'employee_name', 'plan', 'plan_name',
            'status', 'status_display', 'grant_date', 'number_of_shares',
            'grant_price', 'vesting_start_date', 'vesting_end_date',
            'cliff_months', 'vesting_schedule', 'shares_vested', 'shares_exercised',
            'shares_available_to_exercise', 'vesting_percentage', 'grant_value',
            'current_fair_value', 'department', 'notes', 'approved_by',
            'approved_date', 'vesting_events', 'exercises', 'created_at', 'updated_at'
        ]
        read_only_fields = ['grant_number', 'shares_vested', 'shares_exercised', 'created_at', 'updated_at']


class EquityGrantSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    vesting_percentage = serializers.ReadOnlyField()

    class Meta:
        model = EquityGrant
        fields = [
            'id', 'grant_number', 'employee', 'employee_name', 'plan',
            'status', 'status_display', 'grant_date', 'number_of_shares',
            'grant_price', 'shares_vested', 'vesting_percentage', 'grant_value',
            'current_fair_value', 'approved_date', 'created_at'
        ]
        read_only_fields = ['grant_number', 'shares_vested', 'created_at']


class ESOPSerializer(serializers.ModelSerializer):
    shares_available = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ESOP
        fields = [
            'id', 'name', 'status', 'status_display', 'total_shares_authorized',
            'shares_allocated', 'shares_available', 'contribution_limit_percentage',
            'minimum_tenure_months', 'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['shares_allocated', 'created_at', 'updated_at']

    def get_shares_available(self, obj):
        return obj.shares_available


class ESOPParticipantDetailedSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    esop_name = serializers.CharField(source='esop.name', read_only=True)

    class Meta:
        model = ESOPParticipant
        fields = [
            'id', 'esop', 'esop_name', 'employee', 'employee_name', 'status',
            'status_display', 'shares_owned', 'total_contributions', 'enrollment_date',
            'withdrawal_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['shares_owned', 'total_contributions', 'created_at', 'updated_at']


class ESOPParticipantSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = ESOPParticipant
        fields = [
            'id', 'employee', 'employee_name', 'status', 'status_display',
            'shares_owned', 'total_contributions', 'enrollment_date'
        ]
        read_only_fields = ['shares_owned', 'total_contributions']


class EquityReportSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = EquityReport
        fields = [
            'id', 'report_type', 'report_type_display', 'report_date',
            'total_shares_outstanding', 'total_awards_value', 'expense_recognition',
            'file_url', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_at']
