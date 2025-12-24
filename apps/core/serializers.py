from rest_framework import serializers
from .models import Department, JobPosition


class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'manager', 'manager_name', 'budget', 'is_active', 'created_at']


class JobPositionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = JobPosition
        fields = ['id', 'title', 'department', 'department_name', 'description', 'salary_range_min', 'salary_range_max', 'is_active', 'created_at']
