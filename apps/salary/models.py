from django.db import models
from django.utils import timezone
from apps.employees.models import Employee
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import datetime, date

class Salary(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('processed', 'Processed'),
        ('paid', 'Paid'),
        ('pending', 'Pending'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salaries')
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    
    # Base calculations
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    working_days = models.IntegerField(default=0)
    actual_working_days = models.IntegerField(default=0)
    
    # Allowances
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deductions
    income_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    health_insurance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    social_security = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Bonuses
    performance_bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Final amounts
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_salaries')
    processed_date = models.DateTimeField(null=True, blank=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'month', 'year')
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['employee', 'month', 'year']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.employee} - {self.month}/{self.year} ({self.status})"
    
    def calculate_salary(self):
        """Calculate all salary components"""
        from apps.attendance.models import AttendanceSummary
        
        # Get attendance data
        try:
            attendance = AttendanceSummary.objects.get(
                employee=self.employee,
                month=self.month,
                year=self.year
            )
            self.actual_working_days = attendance.total_present + attendance.total_half_day * 0.5
        except AttendanceSummary.DoesNotExist:
            self.actual_working_days = self.working_days
        
        # Calculate basic salary
        if self.working_days > 0:
            daily_rate = self.base_salary / Decimal(self.working_days)
            self.basic_salary = daily_rate * Decimal(str(self.actual_working_days))
        else:
            self.basic_salary = self.base_salary
        
        # Get allowances
        benefits = self.employee.benefits
        self.allowances = benefits.health_insurance_amount + benefits.pension_amount
        
        # Gross salary
        self.gross_salary = self.basic_salary + self.allowances
        
        # Calculate deductions
        TAX_RATE = Decimal('0.15')
        HEALTH_INSURANCE_RATE = Decimal('0.05')
        SOCIAL_SECURITY_RATE = Decimal('0.08')
        
        self.income_tax = self.gross_salary * TAX_RATE
        self.health_insurance = self.gross_salary * HEALTH_INSURANCE_RATE
        self.social_security = self.gross_salary * SOCIAL_SECURITY_RATE
        
        self.total_deductions = (
            self.income_tax +
            self.health_insurance +
            self.social_security +
            self.other_deductions
        )
        
        # Performance bonus
        self.performance_bonus = self.gross_salary * Decimal('0.10')  # 10% bonus
        
        # Net salary
        self.net_salary = (
            self.gross_salary +
            self.performance_bonus -
            self.total_deductions
        )
        
        self.save()
        return self
    
    def process(self, user):
        """Process the salary"""
        if self.status != 'draft':
            raise ValueError('Salary has already been processed')
        
        self.status = 'processed'
        self.processed_by = user
        self.processed_date = timezone.now()
        self.save()
    
    def mark_as_paid(self):
        """Mark salary as paid"""
        if self.status != 'processed':
            raise ValueError('Salary must be processed before marking as paid')
        
        self.status = 'paid'
        self.paid_date = timezone.now()
        self.save()


class SalaryTransaction(models.Model):
    TRANSACTION_TYPE = [
        ('debit', 'Debit'),
        ('credit', 'Credit'),
    ]
    
    salary = models.ForeignKey(Salary, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.salary} - {self.transaction_type} {self.amount}"


class PayrollBatch(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('ready', 'Ready to Process'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
    ]
    
    month = models.IntegerField()
    year = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_employees = models.IntegerField(default=0)
    processed_count = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_payroll_batches')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_payroll_batches')
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('month', 'year')
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"Payroll {self.month}/{self.year}"
