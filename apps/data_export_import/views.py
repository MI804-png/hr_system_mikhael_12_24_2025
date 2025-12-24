from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Sum
from datetime import datetime, timedelta
import json

from .models import (
    ExportTemplate, DataExport, ImportTemplate, DataImport,
    Report, GeneratedReport, PrintTemplate, PrintedDocument
)
from .serializers import (
    ExportTemplateSerializer, DataExportSerializer, ImportTemplateSerializer,
    DataImportSerializer, ReportSerializer, GeneratedReportSerializer,
    PrintTemplateSerializer, PrintedDocumentSerializer
)


class ExportTemplateViewSet(viewsets.ModelViewSet):
    """Manage export templates"""
    queryset = ExportTemplate.objects.all()
    serializer_class = ExportTemplateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['data_type', 'export_format', 'is_active']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an export template"""
        template = self.get_object()
        new_template = ExportTemplate.objects.create(
            name=f"{template.name} (Copy)",
            description=template.description,
            data_type=template.data_type,
            export_format=template.export_format,
            selected_fields=template.selected_fields,
            include_headers=template.include_headers,
            filter_criteria=template.filter_criteria,
            date_format=template.date_format,
            decimal_places=template.decimal_places,
            include_summary=template.include_summary,
            include_formulas=template.include_formulas,
            created_by=request.user.employee
        )
        
        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DataExportViewSet(viewsets.ModelViewSet):
    """Manage data exports"""
    queryset = DataExport.objects.all()
    serializer_class = DataExportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['template', 'status']
    ordering_fields = ['export_date', 'total_records']
    ordering = ['-export_date']

    @action(detail=True, methods=['post'])
    def trigger_export(self, request, pk=None):
        """Trigger data export"""
        export = self.get_object()
        export.status = 'PROCESSING'
        export.start_time = timezone.now()
        export.save()
        
        # Simulate processing (in production, would call actual export logic)
        export.status = 'COMPLETED'
        export.completion_time = timezone.now()
        export.exported_records = export.total_records
        export.file_path = f"/exports/export_{export.id}.{export.template.export_format.lower()}"
        export.save()
        
        serializer = self.get_serializer(export)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_and_export(self, request):
        """Create export from template and immediately export"""
        template_id = request.data.get('template_id')
        
        if not template_id:
            return Response({'error': 'template_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            template = ExportTemplate.objects.get(id=template_id)
        except ExportTemplate.DoesNotExist:
            return Response({'error': 'Template not found'}, status=status.HTTP_404_NOT_FOUND)
        
        export = DataExport.objects.create(
            template=template,
            status='PENDING',
            requested_by=request.user.employee
        )
        
        serializer = self.get_serializer(export)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ImportTemplateViewSet(viewsets.ModelViewSet):
    """Manage import templates"""
    queryset = ImportTemplate.objects.all()
    serializer_class = ImportTemplateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['data_type', 'import_format', 'is_active']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['post'])
    def validate_mapping(self, request, pk=None):
        """Validate column mapping"""
        template = self.get_object()
        
        required_fields = request.data.get('required_fields', [])
        mapped_fields = list(template.column_mapping.values())
        
        missing_fields = [f for f in required_fields if f not in mapped_fields]
        
        return Response({
            'is_valid': len(missing_fields) == 0,
            'missing_fields': missing_fields,
            'mapped_fields_count': len(template.column_mapping)
        })


class DataImportViewSet(viewsets.ModelViewSet):
    """Manage data imports"""
    queryset = DataImport.objects.all()
    serializer_class = DataImportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['template', 'status']
    ordering_fields = ['import_date', 'total_rows']
    ordering = ['-import_date']

    @action(detail=True, methods=['post'])
    def trigger_import(self, request, pk=None):
        """Trigger data import"""
        import_job = self.get_object()
        import_job.status = 'VALIDATING'
        import_job.start_time = timezone.now()
        import_job.save()
        
        # Simulate processing
        import_job.status = 'COMPLETED'
        import_job.completion_time = timezone.now()
        import_job.imported_rows = import_job.total_rows - import_job.failed_rows
        import_job.save()
        
        serializer = self.get_serializer(import_job)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent_imports(self, request):
        """Get recent imports"""
        recent = DataImport.objects.all()[:10]
        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def error_details(self, request, pk=None):
        """Get detailed error information"""
        import_job = self.get_object()
        return Response({
            'validation_errors': import_job.validation_errors,
            'import_errors': import_job.import_errors,
            'failed_rows': import_job.failed_rows,
            'total_rows': import_job.total_rows
        })


class ReportViewSet(viewsets.ModelViewSet):
    """Manage report configurations"""
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['report_type', 'is_active']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate report"""
        report = self.get_object()
        
        generated = GeneratedReport.objects.create(
            report=report,
            status='GENERATING',
            output_format=request.data.get('output_format', 'PDF'),
            generated_by=request.user.employee
        )
        
        # Simulate processing
        generated.status = 'COMPLETED'
        generated.total_pages = 10
        generated.total_records = 100
        generated.file_path = f"/reports/report_{generated.id}.{generated.output_format.lower()}"
        generated.save()
        
        serializer = GeneratedReportSerializer(generated)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def schedule(self, request, pk=None):
        """Schedule recurring report generation"""
        report = self.get_object()
        report.is_scheduled = True
        report.schedule_frequency = request.data.get('schedule_frequency')
        report.email_recipients = request.data.get('email_recipients', [])
        report.next_scheduled_date = request.data.get('next_scheduled_date')
        report.save()
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)


class GeneratedReportViewSet(viewsets.ModelViewSet):
    """View generated reports"""
    queryset = GeneratedReport.objects.all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['report', 'status']
    ordering_fields = ['generation_date', 'total_records']
    ordering = ['-generation_date']

    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Record report download"""
        report = self.get_object()
        report.download_count += 1
        report.save()
        
        return Response({'download_count': report.download_count})

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share report with employees"""
        report = self.get_object()
        employee_ids = request.data.get('employee_ids', [])
        
        for emp_id in employee_ids:
            report.shared_with.add(emp_id)
        
        return Response({'shared_with_count': report.shared_with.count()})


class PrintTemplateViewSet(viewsets.ModelViewSet):
    """Manage print templates"""
    queryset = PrintTemplate.objects.all()
    serializer_class = PrintTemplateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['document_type']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Preview template with sample data"""
        template = self.get_object()
        
        # Sample data mapping
        sample_data = request.data.get('sample_data', {})
        
        # Simple template variable replacement
        preview_content = template.template_variables
        for var in preview_content:
            placeholder = f"{{{{{var}}}}}"
            value = sample_data.get(var, f"[{var}]")
            
        return Response({
            'preview': preview_content,
            'font_family': template.font_family,
            'font_size': template.font_size
        })

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate template"""
        template = self.get_object()
        new_template = PrintTemplate.objects.create(
            name=f"{template.name} (Copy)",
            document_type=template.document_type,
            header_image_url=template.header_image_url,
            footer_text=template.footer_text,
            template_variables=template.template_variables,
            font_family=template.font_family,
            font_size=template.font_size,
            page_size=template.page_size,
            orientation=template.orientation,
            margin_top=template.margin_top,
            margin_bottom=template.margin_bottom,
            margin_left=template.margin_left,
            margin_right=template.margin_right,
            created_by=request.user.employee
        )
        
        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PrintedDocumentViewSet(viewsets.ModelViewSet):
    """Manage printed documents"""
    queryset = PrintedDocument.objects.all()
    serializer_class = PrintedDocumentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['template', 'employee', 'status']
    ordering_fields = ['created_date', 'printed_date']
    ordering = ['-created_date']

    @action(detail=True, methods=['post'])
    def mark_printed(self, request, pk=None):
        """Mark document as printed"""
        document = self.get_object()
        document.status = 'PRINTED'
        document.printed_date = timezone.now().date()
        document.print_count = document.print_count + 1
        document.save()
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_signed(self, request, pk=None):
        """Mark document as signed"""
        document = self.get_object()
        document.status = 'SIGNED'
        document.signed_date = timezone.now().date()
        document.save()
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive document"""
        document = self.get_object()
        document.status = 'ARCHIVED'
        document.save()
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_signature(self, request):
        """Get documents awaiting signature"""
        docs = PrintedDocument.objects.filter(status='READY_TO_PRINT')
        serializer = self.get_serializer(docs, many=True)
        return Response(serializer.data)
