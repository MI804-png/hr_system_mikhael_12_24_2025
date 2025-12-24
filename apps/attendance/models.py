from django.db import models
from django.utils import timezone
from apps.employees.models import Employee

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
        ('leave', 'On Leave'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
        ]
    
    def __str__(self):
        return f"{self.employee} - {self.date} ({self.status})"
    
    @property
    def work_hours(self):
        if self.check_in_time and self.check_out_time:
            from datetime import datetime, timedelta
            start = datetime.combine(timezone.now().date(), self.check_in_time)
            end = datetime.combine(timezone.now().date(), self.check_out_time)
            duration = end - start
            return duration.total_seconds() / 3600
        return 0


class AttendanceSummary(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='attendance_summary')
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    
    total_present = models.IntegerField(default=0)
    total_absent = models.IntegerField(default=0)
    total_late = models.IntegerField(default=0)
    total_half_day = models.IntegerField(default=0)
    total_leave = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'month', 'year')
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.employee} - {self.month}/{self.year}"
    
    @property
    def working_days(self):
        return self.total_present + self.total_absent + self.total_late + self.total_half_day
