from django.db import models
from django.contrib.postgres.fields import ArrayField
from decimal import Decimal

from apps.employees.models import Employee


class ExportTemplate(models.Model):
    """Configure custom export templates"""
    EXPORT_FORMAT_CHOICES = [
        ('EXCEL', 'Excel (.xlsx)'),
        ('CSV', 'CSV (.csv)'),
        ('PDF', 'PDF (.pdf)'),
        ('JSON', 'JSON'),
    ]

    DATA_TYPE_CHOICES = [
        ('EMPLOYEES', 'Employee Data'),
        ('PAYROLL', 'Payroll Data'),
        ('ATTENDANCE', 'Attendance Data'),
        ('LEAVE', 'Leave Data'),
        ('PERFORMANCE', 'Performance Data'),
        ('TRAINING', 'Training Data'),
        ('BENEFITS', 'Benefits Data'),
        ('COMPLIANCE', 'Compliance Data'),
        ('BUDGETS', 'Budget Data'),
        ('COMPENSATION', 'Compensation Data'),
        ('TURNOVER', 'Turnover Data'),
        ('ENGAGEMENT', 'Engagement Data'),
        ('CUSTOM', 'Custom Data'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    data_type = models.CharField(max_length=50, choices=DATA_TYPE_CHOICES)
    export_format = models.CharField(max_length=20, choices=EXPORT_FORMAT_CHOICES)
    
    # Column configuration
    selected_fields = models.JSONField(default=list, help_text="List of field names to export")
    include_headers = models.BooleanField(default=True)
    
    # Filtering
    filter_criteria = models.JSONField(default=dict, blank=True, help_text="Filter conditions")
    
    # Formatting
    date_format = models.CharField(max_length=20, default='YYYY-MM-DD')
    decimal_places = models.IntegerField(default=2)
    
    # Include
    include_summary = models.BooleanField(default=True)
    include_formulas = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_export_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'export_template'
        ordering = ['name']
        indexes = [
            models.Index(fields=['data_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_export_format_display()})"


class DataExport(models.Model):
    """Track data exports"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    template = models.ForeignKey(ExportTemplate, on_delete=models.CASCADE, related_name='exports')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    export_date = models.DateField(auto_now_add=True)
    start_time = models.DateTimeField(auto_now_add=True)
    completion_time = models.DateTimeField(null=True, blank=True)
    
    total_records = models.IntegerField(default=0)
    exported_records = models.IntegerField(default=0)
    
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(default=0, help_text="File size in bytes")
    
    requested_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='data_exports')
    
    error_message = models.TextField(blank=True)
    
    # Include in reports
    included_in_reports = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'data_export'
        ordering = ['-export_date']
        indexes = [
            models.Index(fields=['template', 'status']),
            models.Index(fields=['export_date']),
        ]

    def __str__(self):
        return f"Export - {self.template.name} ({self.export_date})"


class ImportTemplate(models.Model):
    """Configure bulk import templates"""
    IMPORT_FORMAT_CHOICES = [
        ('EXCEL', 'Excel (.xlsx)'),
        ('CSV', 'CSV (.csv)'),
        ('JSON', 'JSON'),
    ]

    DATA_TYPE_CHOICES = [
        ('EMPLOYEES', 'Employee Data'),
        ('PAYROLL', 'Payroll Data'),
        ('ATTENDANCE', 'Attendance Data'),
        ('LEAVE', 'Leave Data'),
        ('COMPENSATION', 'Compensation Data'),
        ('PERFORMANCE', 'Performance Data'),
        ('TRAINING', 'Training Data'),
        ('CUSTOM', 'Custom Data'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    data_type = models.CharField(max_length=50, choices=DATA_TYPE_CHOICES)
    import_format = models.CharField(max_length=20, choices=IMPORT_FORMAT_CHOICES)
    
    # Column mapping
    column_mapping = models.JSONField(default=dict, help_text="Map import columns to model fields")
    
    # Validation rules
    validation_rules = models.JSONField(default=dict, blank=True, help_text="Custom validation rules")
    
    # Behavior
    skip_header_row = models.BooleanField(default=True)
    update_existing = models.BooleanField(default=False, help_text="Update existing records instead of creating new")
    validate_only = models.BooleanField(default=False, help_text="Validation mode without saving")
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_import_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'import_template'
        ordering = ['name']
        indexes = [
            models.Index(fields=['data_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_import_format_display()})"


class DataImport(models.Model):
    """Track data imports"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VALIDATING', 'Validating'),
        ('IMPORTING', 'Importing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('PARTIAL', 'Partial Success'),
    ]

    template = models.ForeignKey(ImportTemplate, on_delete=models.CASCADE, related_name='imports')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    import_date = models.DateField(auto_now_add=True)
    start_time = models.DateTimeField(auto_now_add=True)
    completion_time = models.DateTimeField(null=True, blank=True)
    
    source_file_name = models.CharField(max_length=255)
    total_rows = models.IntegerField(default=0)
    imported_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    skipped_rows = models.IntegerField(default=0)
    
    validation_errors = models.JSONField(default=list, blank=True)
    import_errors = models.JSONField(default=list, blank=True)
    
    requested_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='data_imports')
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'data_import'
        ordering = ['-import_date']
        indexes = [
            models.Index(fields=['template', 'status']),
            models.Index(fields=['import_date']),
        ]

    def __str__(self):
        return f"Import - {self.template.name} ({self.import_date})"


class Report(models.Model):
    """Configure custom reports"""
    REPORT_TYPE_CHOICES = [
        ('STANDARD', 'Standard Report'),
        ('DASHBOARD', 'Dashboard'),
        ('COMPLIANCE', 'Compliance Report'),
        ('FINANCIAL', 'Financial Report'),
        ('ANALYTICAL', 'Analytical Report'),
        ('CUSTOM', 'Custom Report'),
    ]

    OUTPUT_FORMAT_CHOICES = [
        ('PDF', 'PDF'),
        ('EXCEL', 'Excel'),
        ('WORD', 'Word Document'),
        ('HTML', 'HTML'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    
    # Data sources
    data_sources = models.JSONField(default=list, help_text="List of apps/models to include")
    
    # Layout
    include_title_page = models.BooleanField(default=True)
    include_toc = models.BooleanField(default=True)
    include_summary = models.BooleanField(default=True)
    include_charts = models.BooleanField(default=True)
    include_appendix = models.BooleanField(default=False)
    
    # Styling
    template_style = models.CharField(max_length=50, default='PROFESSIONAL')  # PROFESSIONAL, MODERN, MINIMAL
    
    # Filters and grouping
    filter_criteria = models.JSONField(default=dict, blank=True)
    group_by = models.CharField(max_length=100, blank=True)
    sort_by = models.CharField(max_length=100, blank=True)
    
    # Scheduling
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(
        max_length=20,
        blank=True,
        choices=[
            ('DAILY', 'Daily'),
            ('WEEKLY', 'Weekly'),
            ('MONTHLY', 'Monthly'),
            ('QUARTERLY', 'Quarterly'),
            ('ANNUAL', 'Annual'),
        ]
    )
    next_scheduled_date = models.DateTimeField(null=True, blank=True)
    
    # Recipients
    email_recipients = models.JSONField(default=list, blank=True, help_text="Email addresses for automated delivery")
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'report'
        ordering = ['name']
        indexes = [
            models.Index(fields=['report_type', 'is_active']),
        ]

    def __str__(self):
        return self.name


class GeneratedReport(models.Model):
    """Track generated reports"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('GENERATING', 'Generating'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    FORMAT_CHOICES = [
        ('PDF', 'PDF'),
        ('EXCEL', 'Excel'),
        ('CSV', 'CSV'),
        ('JSON', 'JSON'),
    ]

    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='generated_reports')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    generation_date = models.DateField(auto_now_add=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    output_format = models.CharField(max_length=20, choices=FORMAT_CHOICES)
    
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(default=0)
    
    total_pages = models.IntegerField(default=0)
    total_records = models.IntegerField(default=0)
    
    generated_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='generated_reports')
    
    error_message = models.TextField(blank=True)
    
    # Sharing
    download_count = models.IntegerField(default=0)
    shared_with = models.ManyToManyField(Employee, related_name='shared_reports', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'generated_report'
        ordering = ['-generation_date']
        indexes = [
            models.Index(fields=['report', 'status']),
            models.Index(fields=['generation_date']),
        ]

    def __str__(self):
        return f"{self.report.name} - {self.generation_date}"


class PrintTemplate(models.Model):
    """Configure print-ready document templates"""
    DOCUMENT_TYPE_CHOICES = [
        ('OFFER_LETTER', 'Offer Letter'),
        ('EMPLOYMENT_CONTRACT', 'Employment Contract'),
        ('PROMOTION_LETTER', 'Promotion Letter'),
        ('TERMINATION_LETTER', 'Termination Letter'),
        ('CERTIFICATE', 'Certificate'),
        ('PAYSLIP', 'Payslip'),
        ('ID_BADGE', 'ID Badge'),
        ('CUSTOM', 'Custom Document'),
    ]

    name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    
    # Template content
    header_image_url = models.URLField(blank=True)
    footer_text = models.CharField(max_length=255, blank=True)
    
    # Template variables (placeholders)
    template_variables = models.JSONField(default=list, help_text="Available variables like {{employee_name}}, {{date}}")
    
    # Styling
    font_family = models.CharField(max_length=50, default='Arial')
    font_size = models.IntegerField(default=11)
    page_size = models.CharField(max_length=20, default='A4', choices=[('A4', 'A4'), ('LETTER', 'Letter')])
    orientation = models.CharField(max_length=20, default='PORTRAIT', choices=[('PORTRAIT', 'Portrait'), ('LANDSCAPE', 'Landscape')])
    
    # Margins
    margin_top = models.IntegerField(default=1, help_text="Inches")
    margin_bottom = models.IntegerField(default=1)
    margin_left = models.IntegerField(default=1)
    margin_right = models.IntegerField(default=1)
    
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_print_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'print_template'
        ordering = ['name']
        indexes = [
            models.Index(fields=['document_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()})"


class PrintedDocument(models.Model):
    """Track printed documents"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('READY_TO_PRINT', 'Ready to Print'),
        ('PRINTED', 'Printed'),
        ('SIGNED', 'Signed'),
        ('ARCHIVED', 'Archived'),
    ]

    template = models.ForeignKey(PrintTemplate, on_delete=models.CASCADE, related_name='printed_documents')
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='printed_documents')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Content
    generated_content = models.TextField()
    
    # Dates
    created_date = models.DateField(auto_now_add=True)
    printed_date = models.DateField(null=True, blank=True)
    signed_date = models.DateField(null=True, blank=True)
    
    # Tracking
    print_count = models.IntegerField(default=0)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_printed_documents')
    
    file_path = models.CharField(max_length=500, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'printed_document'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['template', 'employee']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.template.name} - {self.employee}"
