from rest_framework import serializers

from .models import (
    ExportTemplate, DataExport, ImportTemplate, DataImport,
    Report, GeneratedReport, PrintTemplate, PrintedDocument
)


class ExportTemplateSerializer(serializers.ModelSerializer):
    export_format_display = serializers.CharField(source='get_export_format_display', read_only=True)
    data_type_display = serializers.CharField(source='get_data_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ExportTemplate
        fields = [
            'id', 'name', 'description', 'data_type', 'data_type_display',
            'export_format', 'export_format_display', 'selected_fields',
            'include_headers', 'filter_criteria', 'date_format', 'decimal_places',
            'include_summary', 'include_formulas', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DataExportSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)

    class Meta:
        model = DataExport
        fields = [
            'id', 'template', 'template_name', 'status', 'status_display',
            'export_date', 'start_time', 'completion_time', 'total_records',
            'exported_records', 'file_path', 'file_size', 'requested_by',
            'requested_by_name', 'error_message', 'created_at'
        ]
        read_only_fields = ['export_date', 'start_time', 'created_at']


class ImportTemplateSerializer(serializers.ModelSerializer):
    import_format_display = serializers.CharField(source='get_import_format_display', read_only=True)
    data_type_display = serializers.CharField(source='get_data_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ImportTemplate
        fields = [
            'id', 'name', 'description', 'data_type', 'data_type_display',
            'import_format', 'import_format_display', 'column_mapping',
            'validation_rules', 'skip_header_row', 'update_existing',
            'validate_only', 'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DataImportSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)

    class Meta:
        model = DataImport
        fields = [
            'id', 'template', 'template_name', 'status', 'status_display',
            'import_date', 'start_time', 'completion_time', 'source_file_name',
            'total_rows', 'imported_rows', 'failed_rows', 'skipped_rows',
            'validation_errors', 'import_errors', 'requested_by',
            'requested_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['import_date', 'start_time', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'name', 'description', 'report_type', 'report_type_display',
            'data_sources', 'include_title_page', 'include_toc', 'include_summary',
            'include_charts', 'include_appendix', 'template_style', 'filter_criteria',
            'group_by', 'sort_by', 'is_scheduled', 'schedule_frequency',
            'next_scheduled_date', 'email_recipients', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class GeneratedReportSerializer(serializers.ModelSerializer):
    report_name = serializers.CharField(source='report.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)

    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'report', 'report_name', 'status', 'status_display',
            'generation_date', 'generated_at', 'output_format', 'file_path',
            'file_size', 'total_pages', 'total_records', 'generated_by',
            'generated_by_name', 'error_message', 'download_count',
            'shared_with', 'created_at'
        ]
        read_only_fields = ['generation_date', 'generated_at', 'created_at']


class PrintTemplateSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = PrintTemplate
        fields = [
            'id', 'name', 'document_type', 'document_type_display',
            'header_image_url', 'footer_text', 'template_variables',
            'font_family', 'font_size', 'page_size', 'orientation',
            'margin_top', 'margin_bottom', 'margin_left', 'margin_right',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PrintedDocumentSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = PrintedDocument
        fields = [
            'id', 'template', 'template_name', 'employee', 'employee_name',
            'status', 'status_display', 'generated_content', 'created_date',
            'printed_date', 'signed_date', 'print_count', 'created_by',
            'created_by_name', 'file_path', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_date', 'created_at', 'updated_at']
