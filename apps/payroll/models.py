from django.db import models
from django.contrib.auth.models import User
from apps.employees.models import Employee
from decimal import Decimal


class PayrollPeriod(models.Model):
    """Define payroll cycles (monthly, bi-weekly, etc.)"""
    FREQUENCY_CHOICES = [
        ('weekly', 'Weekly'),
        ('bi_weekly', 'Bi-Weekly'),
        ('semi_monthly', 'Semi-Monthly'),
        ('monthly', 'Monthly'),
    ]
    
    name = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    payment_date = models.DateField()
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date']
        verbose_name = 'Payroll Period'
        verbose_name_plural = 'Payroll Periods'
    
    def __str__(self):
        return f"{self.name} - {self.start_date} to {self.end_date}"


class TaxConfiguration(models.Model):
    """Tax settings for payroll calculations"""
    TAX_TYPE_CHOICES = [
        ('federal_income', 'Federal Income Tax'),
        ('state_income', 'State Income Tax'),
        ('fica', 'FICA Tax'),
        ('unemployment', 'Unemployment Tax'),
        ('other', 'Other Tax'),
    ]
    
    tax_type = models.CharField(max_length=50, choices=TAX_TYPE_CHOICES)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage
    employee_contribution = models.DecimalField(max_digits=5, decimal_places=2)  # Employee %
    employer_contribution = models.DecimalField(max_digits=5, decimal_places=2)  # Employer %
    effective_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-effective_date']
        verbose_name = 'Tax Configuration'
        verbose_name_plural = 'Tax Configurations'
    
    def __str__(self):
        return f"{self.get_tax_type_display()} - {self.tax_rate}%"


class Deduction(models.Model):
    """Employee deductions (health insurance, retirement, etc.)"""
    DEDUCTION_TYPE_CHOICES = [
        ('health_insurance', 'Health Insurance'),
        ('dental_insurance', 'Dental Insurance'),
        ('vision_insurance', 'Vision Insurance'),
        ('life_insurance', 'Life Insurance'),
        ('retirement_401k', 'Retirement (401k)'),
        ('ira', 'IRA'),
        ('hsa', 'Health Savings Account'),
        ('fsa', 'Flexible Spending Account'),
        ('other', 'Other'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='deductions')
    deduction_type = models.CharField(max_length=50, choices=DEDUCTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=[
        ('per_paycheck', 'Per Paycheck'),
        ('monthly', 'Monthly'),
        ('annual', 'Annual'),
    ])
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Deduction'
        verbose_name_plural = 'Deductions'
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.get_deduction_type_display()}"


class PayCheck(models.Model):
    """Individual paycheck record"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('paid', 'Paid'),
        ('voided', 'Voided'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='paychecks')
    payroll_period = models.ForeignKey(PayrollPeriod, on_delete=models.SET_NULL, null=True)
    
    # Base amounts
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    regular_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    overtime_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Additions
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deductions
    federal_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    state_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fica_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    health_insurance_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    retirement_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Net pay
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status and dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    payment_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='paychecks_created')
    
    class Meta:
        ordering = ['-payment_date']
        verbose_name = 'PayCheck'
        verbose_name_plural = 'PayChecks'
        unique_together = ('employee', 'payroll_period')
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.payment_date}"


class PayrollDeduction(models.Model):
    """Track actual deductions applied to a paycheck"""
    paycheck = models.ForeignKey(PayCheck, on_delete=models.CASCADE, related_name='deduction_items')
    deduction = models.ForeignKey(Deduction, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    class Meta:
        verbose_name = 'Payroll Deduction'
        verbose_name_plural = 'Payroll Deductions'
    
    def __str__(self):
        return f"{self.paycheck.employee.user.username} - {self.amount}"


class TimesheetEntry(models.Model):
    """Track working hours for payroll"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='timesheet_entries')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_minutes = models.IntegerField(default=0)
    hours_worked = models.DecimalField(max_digits=8, decimal_places=2)
    is_overtime = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_timesheets')
    approved_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = 'Timesheet Entry'
        verbose_name_plural = 'Timesheet Entries'
        unique_together = ('employee', 'date')
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.date} ({self.hours_worked}h)"


class Bonus(models.Model):
    """Bonus records for payroll"""
    BONUS_TYPE_CHOICES = [
        ('performance', 'Performance Bonus'),
        ('annual', 'Annual Bonus'),
        ('referral', 'Referral Bonus'),
        ('signing', 'Signing Bonus'),
        ('special', 'Special Bonus'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bonuses')
    bonus_type = models.CharField(max_length=50, choices=BONUS_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    percentage_of_salary = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    effective_date = models.DateField()
    payroll_period = models.ForeignKey(PayrollPeriod, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField()
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='bonuses_approved')
    approved_date = models.DateTimeField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effective_date']
        verbose_name = 'Bonus'
        verbose_name_plural = 'Bonuses'
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.get_bonus_type_display()} - {self.amount}"


class Raise(models.Model):
    """Salary raise records"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='raises')
    previous_salary = models.DecimalField(max_digits=12, decimal_places=2)
    new_salary = models.DecimalField(max_digits=12, decimal_places=2)
    raise_amount = models.DecimalField(max_digits=12, decimal_places=2)
    raise_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    effective_date = models.DateField()
    reason = models.TextField()
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='raises_approved')
    approved_date = models.DateTimeField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effective_date']
        verbose_name = 'Raise'
        verbose_name_plural = 'Raises'
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.raise_percentage}% raise"


class PayrollReport(models.Model):
    """Aggregate payroll reports"""
    REPORT_TYPE_CHOICES = [
        ('monthly', 'Monthly Payroll'),
        ('quarterly', 'Quarterly Payroll'),
        ('annual', 'Annual Payroll'),
        ('tax', 'Tax Report'),
        ('deduction', 'Deduction Report'),
    ]
    
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    payroll_period = models.ForeignKey(PayrollPeriod, on_delete=models.SET_NULL, null=True)
    total_employees = models.IntegerField()
    total_gross_pay = models.DecimalField(max_digits=15, decimal_places=2)
    total_deductions = models.DecimalField(max_digits=15, decimal_places=2)
    total_net_pay = models.DecimalField(max_digits=15, decimal_places=2)
    total_taxes = models.DecimalField(max_digits=15, decimal_places=2)
    total_employer_contributions = models.DecimalField(max_digits=15, decimal_places=2)
    generated_date = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-generated_date']
        verbose_name = 'Payroll Report'
        verbose_name_plural = 'Payroll Reports'
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.generated_date.date()}"
