from rest_framework import serializers
from .models import SavedSearch


class SavedSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedSearch
        fields = ['id', 'name', 'description', 'filters', 'created_at']


class AdvancedSearchSerializer(serializers.Serializer):
    """Serializer for advanced search filters"""
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    position = serializers.CharField(required=False, allow_blank=True)
    employment_type = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    salary_min = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    salary_max = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    hire_date_from = serializers.DateField(required=False, allow_null=True)
    hire_date_to = serializers.DateField(required=False, allow_null=True)
    skills = serializers.ListField(child=serializers.CharField(), required=False)
    certifications = serializers.ListField(child=serializers.CharField(), required=False)
    performance_rating_min = serializers.FloatField(required=False, allow_null=True)
    performance_rating_max = serializers.FloatField(required=False, allow_null=True)
