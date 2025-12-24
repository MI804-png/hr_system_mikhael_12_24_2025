from django.db import models
from rest_framework import serializers
from apps.employees.models import Employee

class SavedSearch(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Search filters stored as JSON for flexibility
    filters = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class AdvancedSearchSerializer(serializers.Serializer):
    # Employee search filters
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    
    # Employment details
    department = serializers.CharField(required=False, allow_blank=True)
    position = serializers.CharField(required=False, allow_blank=True)
    employment_type = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)
    
    # Salary range
    salary_min = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    salary_max = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    # Date range for hire date
    hired_date_from = serializers.DateField(required=False, allow_null=True)
    hired_date_to = serializers.DateField(required=False, allow_null=True)
    
    # Skills
    skills = serializers.ListField(child=serializers.CharField(), required=False)
    
    # Attendance
    attendance_percentage_min = serializers.IntegerField(required=False, allow_null=True)
    
    # Certifications
    has_certification = serializers.BooleanField(required=False, allow_null=True)
    
    # Performance rating
    min_performance_rating = serializers.IntegerField(required=False, allow_null=True)
    
    # Sorting
    sort_by = serializers.CharField(required=False, allow_blank=True)
    sort_order = serializers.CharField(required=False, allow_blank=True)
