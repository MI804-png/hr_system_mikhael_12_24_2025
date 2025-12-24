from rest_framework import serializers
from .models import Report, ReportFilter

class ReportFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportFilter
        fields = ['id', 'filter_key', 'filter_value']

class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.StringRelatedField(source='generated_by', read_only=True)
    filters = ReportFilterSerializer(many=True, read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'title', 'description',
            'generated_by', 'generated_by_name', 'generated_date',
            'start_date', 'end_date', 'file', 'is_scheduled',
            'schedule_frequency', 'filters', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'generated_date', 'created_at', 'updated_at']
