from rest_framework import serializers
from .models import Attendance, AttendanceSummary

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    work_hours = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'date', 'status',
            'check_in_time', 'check_out_time', 'work_hours', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_work_hours(self, obj):
        return obj.work_hours

class AttendanceSummarySerializer(serializers.ModelSerializer):
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    working_days = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = AttendanceSummary
        fields = [
            'id', 'employee', 'employee_name', 'month', 'year',
            'total_present', 'total_absent', 'total_late',
            'total_half_day', 'total_leave', 'working_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_working_days(self, obj):
        return obj.working_days
