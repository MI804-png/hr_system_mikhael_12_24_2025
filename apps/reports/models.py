from django.db import models
from django.contrib.auth.models import User

class Report(models.Model):
    REPORT_TYPE = [
        ('payroll', 'Payroll Report'),
        ('attendance', 'Attendance Report'),
        ('employee', 'Employee Report'),
        ('cafeteria', 'Cafeteria Report'),
        ('financial', 'Financial Report'),
    ]
    
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    generated_date = models.DateTimeField(auto_now_add=True)
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(
        max_length=50,
        choices=[('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')],
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'generated_date']),
        ]
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.generated_date}"


class ReportFilter(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='filters')
    filter_key = models.CharField(max_length=100)
    filter_value = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.report} - {self.filter_key}: {self.filter_value}"
