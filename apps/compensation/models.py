from django.db import models
from django.contrib.auth.models import User
from apps.employees.models import Employee
from apps.core.models import Department, JobPosition
from decimal import Decimal


class SalaryBand(models.Model):
    """Salary ranges for job positions"""
    job_position = models.ForeignKey(JobPosition, on_delete=models.CASCADE, related_name='salary_bands')
    level = models.CharField(max_length=50)  # e.g., "Entry Level", "Senior", "Lead"
    
    minimum_salary = models.DecimalField(max_digits=12, decimal_places=2)
    midpoint_salary = models.DecimalField(max_digits=12, decimal_places=2)
    maximum_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    effective_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    market_percentile = models.IntegerField(default=50)  # 25th, 50th, 75th percentile
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effective_date']
        verbose_name = 'Salary Band'
        verbose_name_plural = 'Salary Bands'
        unique_together = ('job_position', 'level')
    
    def __str__(self):
        return f"{self.job_position.title} - {self.level}"


class CompensationStructure(models.Model):
    """Define compensation components for positions"""
    FREQUENCY_CHOICES = [
        ('hourly', 'Hourly'),
        ('monthly', 'Monthly'),
        ('annual', 'Annual'),
    ]
    
    job_position = models.ForeignKey(JobPosition, on_delete=models.CASCADE, related_name='compensation_structures')
    
    base_salary_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='annual')
    base_salary_min = models.DecimalField(max_digits=12, decimal_places=2)
    base_salary_max = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Variable compensation
    bonus_percentage_min = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    bonus_percentage_max = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    commission_structure = models.CharField(max_length=255, blank=True)  # e.g., "2% of sales"
    
    # Benefits
    stock_options_available = models.BooleanField(default=False)
    stock_options_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    pto_days = models.IntegerField(default=0)
    sick_days = models.IntegerField(default=0)
    
    effective_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effective_date']
        verbose_name = 'Compensation Structure'
        verbose_name_plural = 'Compensation Structures'
    
    def __str__(self):
        return f"{self.job_position.title} Compensation Structure"


class EmployeeCompensationPlan(models.Model):
    """Individual employee compensation details"""
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='compensation_plan')
    
    # Base compensation
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    salary_frequency = models.CharField(max_length=20, choices=[
        ('hourly', 'Hourly'),
        ('bi_weekly', 'Bi-Weekly'),
        ('monthly', 'Monthly'),
        ('annual', 'Annual'),
    ], default='annual')
    
    # Variable compensation
    target_bonus_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Benefits allocation
    health_insurance_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    retirement_contribution_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Stock compensation
    annual_stock_options = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock_vesting_period = models.IntegerField(default=0)  # months
    
    # PTO
    annual_pto_days = models.IntegerField(default=20)
    annual_sick_days = models.IntegerField(default=10)
    
    # Effective dates
    effective_date = models.DateField()
    next_review_date = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        verbose_name = 'Employee Compensation Plan'
        verbose_name_plural = 'Employee Compensation Plans'
    
    def __str__(self):
        return f"{self.employee.user.username} Compensation Plan"


class IncentivePlan(models.Model):
    """Incentive and performance bonus plans"""
    PLAN_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('department', 'Department'),
        ('company_wide', 'Company-Wide'),
    ]
    
    name = models.CharField(max_length=255)
    plan_type = models.CharField(max_length=50, choices=PLAN_TYPE_CHOICES)
    description = models.TextField()
    
    target_incentive_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    minimum_performance_threshold = models.DecimalField(max_digits=5, decimal_places=2)  # %
    maximum_incentive_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    
    performance_metrics = models.JSONField(default=dict, blank=True)  # Key metrics for the plan
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='incentive_plans_created')
    
    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Incentive Plan'
        verbose_name_plural = 'Incentive Plans'
    
    def __str__(self):
        return self.name


class IncentivePlanEnrollment(models.Model):
    """Employees enrolled in incentive plans"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='incentive_enrollments')
    plan = models.ForeignKey(IncentivePlan, on_delete=models.CASCADE, related_name='enrollments')
    
    target_bonus = models.DecimalField(max_digits=12, decimal_places=2)
    actual_performance = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    actual_bonus = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    enrollment_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Incentive Plan Enrollment'
        verbose_name_plural = 'Incentive Plan Enrollments'
        unique_together = ('employee', 'plan')
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.plan.name}"


class MarketAnalysis(models.Model):
    """Market salary and compensation analysis"""
    job_position = models.ForeignKey(JobPosition, on_delete=models.CASCADE, related_name='market_analyses')
    
    location = models.CharField(max_length=255)
    industry = models.CharField(max_length=255, blank=True)
    company_size = models.CharField(max_length=50)
    
    market_average_salary = models.DecimalField(max_digits=12, decimal_places=2)
    market_25th_percentile = models.DecimalField(max_digits=12, decimal_places=2)
    market_50th_percentile = models.DecimalField(max_digits=12, decimal_places=2)
    market_75th_percentile = models.DecimalField(max_digits=12, decimal_places=2)
    
    data_source = models.CharField(max_length=255, blank=True)  # e.g., "Salary.com", "Bureau of Labor"
    analysis_date = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-analysis_date']
        verbose_name = 'Market Analysis'
        verbose_name_plural = 'Market Analyses'
        unique_together = ('job_position', 'location', 'analysis_date')
    
    def __str__(self):
        return f"{self.job_position.title} - {self.location}"
