from django.db import models
from django.contrib.auth.models import User
from apps.employees.models import Employee
from apps.core.models import Department


class WorkforceCostAnalysis(models.Model):
    """Analyze total cost of workforce"""
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='cost_analyses')
    analysis_date = models.DateField()
    
    # Direct costs
    total_salaries = models.DecimalField(max_digits=15, decimal_places=2)
    total_bonuses = models.DecimalField(max_digits=15, decimal_places=2)
    total_benefits = models.DecimalField(max_digits=15, decimal_places=2)
    total_taxes_employer = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Indirect costs
    training_development = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    recruitment_costs = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    facilities_overhead = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    technology_costs = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Total metrics
    total_annual_cost = models.DecimalField(max_digits=15, decimal_places=2)
    cost_per_employee = models.DecimalField(max_digits=12, decimal_places=2)
    number_of_employees = models.IntegerField()
    
    # Productivity metrics
    revenue_per_employee = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_as_percentage_of_revenue = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='cost_analyses_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-analysis_date']
        verbose_name = 'Workforce Cost Analysis'
        verbose_name_plural = 'Workforce Cost Analyses'
        unique_together = ('department', 'analysis_date')
    
    def __str__(self):
        return f"{self.department.name} - {self.analysis_date}"


class TurnoverAnalysis(models.Model):
    """Track and analyze employee turnover costs"""
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='turnover_analyses')
    analysis_period = models.CharField(max_length=50)  # e.g., "2024 Q1", "2024"
    
    # Turnover metrics
    employees_at_start = models.IntegerField()
    employees_at_end = models.IntegerField()
    employees_terminated = models.IntegerField()
    employees_hired = models.IntegerField()
    turnover_rate = models.DecimalField(max_digits=5, decimal_places=2)  # %
    
    # Cost calculations
    replacement_cost_per_employee = models.DecimalField(max_digits=12, decimal_places=2)
    total_replacement_cost = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Additional costs
    lost_productivity_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    training_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    recruitment_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    severance_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    total_turnover_cost = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Analysis
    primary_reasons_for_departure = models.JSONField(default=dict, blank=True)
    retention_recommendations = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='turnover_analyses_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-analysis_period']
        verbose_name = 'Turnover Analysis'
        verbose_name_plural = 'Turnover Analyses'
        unique_together = ('department', 'analysis_period')
    
    def __str__(self):
        return f"{self.department.name} - {self.analysis_period} (${self.total_turnover_cost})"


class HumanCapitalROI(models.Model):
    """Calculate ROI on human capital investments"""
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='roi_calculations')
    
    measurement_period = models.CharField(max_length=50)  # e.g., "2024", "Q1 2024"
    
    # Investment amounts
    training_investment = models.DecimalField(max_digits=15, decimal_places=2)
    recruitment_investment = models.DecimalField(max_digits=15, decimal_places=2)
    technology_investment = models.DecimalField(max_digits=15, decimal_places=2)
    benefits_investment = models.DecimalField(max_digits=15, decimal_places=2)
    total_investment = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Return metrics
    revenue_generated = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    productivity_gain = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    retention_improvement = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    employee_satisfaction_improvement = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    
    # ROI Calculation
    roi_percentage = models.DecimalField(max_digits=8, decimal_places=2)
    break_even_timeline = models.CharField(max_length=50, blank=True)  # e.g., "6 months", "1 year"
    
    # Analysis
    key_findings = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    
    calculated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-measurement_period']
        verbose_name = 'Human Capital ROI'
        verbose_name_plural = 'Human Capital ROIs'
    
    def __str__(self):
        return f"{self.department.name} - ROI {self.roi_percentage}%"


class StrategicFinancialPlan(models.Model):
    """Long-term strategic financial planning for HR"""
    PLANNING_HORIZON_CHOICES = [
        ('1_year', '1 Year'),
        ('3_year', '3 Years'),
        ('5_year', '5 Years'),
        ('10_year', '10 Years'),
    ]
    
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='financial_plans', null=True, blank=True)
    
    plan_name = models.CharField(max_length=255)
    planning_horizon = models.CharField(max_length=20, choices=PLANNING_HORIZON_CHOICES)
    fiscal_year_start = models.IntegerField()  # e.g., 2024
    
    # Strategic objectives
    workforce_expansion_target = models.IntegerField(null=True, blank=True)  # Target headcount
    cost_reduction_target = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    productivity_improvement_target = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    retention_target = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # %
    
    # Financial projections
    projected_total_salary_cost = models.DecimalField(max_digits=15, decimal_places=2)
    projected_benefits_cost = models.DecimalField(max_digits=15, decimal_places=2)
    projected_training_budget = models.DecimalField(max_digits=15, decimal_places=2)
    projected_recruitment_budget = models.DecimalField(max_digits=15, decimal_places=2)
    
    total_projected_investment = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Expected returns
    expected_productivity_gain = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_cost_savings = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_roi = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Initiatives
    key_initiatives = models.JSONField(default=list, blank=True)  # List of strategic initiatives
    
    # Risks and assumptions
    key_assumptions = models.TextField(blank=True)
    identified_risks = models.TextField(blank=True)
    contingency_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10)  # % buffer
    
    # Status
    status = models.CharField(max_length=50, choices=[
        ('draft', 'Draft'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ], default='draft')
    
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='plans_approved')
    approval_date = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='plans_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fiscal_year_start']
        verbose_name = 'Strategic Financial Plan'
        verbose_name_plural = 'Strategic Financial Plans'
    
    def __str__(self):
        return f"{self.plan_name} (FY{self.fiscal_year_start})"


class FinancialGoal(models.Model):
    """Specific financial goals tied to strategic plan"""
    plan = models.ForeignKey(StrategicFinancialPlan, on_delete=models.CASCADE, related_name='goals')
    
    goal_name = models.CharField(max_length=255)
    description = models.TextField()
    
    GOAL_CATEGORY_CHOICES = [
        ('cost_reduction', 'Cost Reduction'),
        ('revenue_growth', 'Revenue Growth'),
        ('efficiency', 'Efficiency Improvement'),
        ('retention', 'Retention Improvement'),
        ('compensation', 'Compensation Adjustment'),
        ('technology', 'Technology Investment'),
        ('compliance', 'Compliance/Risk'),
    ]
    
    category = models.CharField(max_length=50, choices=GOAL_CATEGORY_CHOICES)
    
    target_value = models.DecimalField(max_digits=15, decimal_places=2)
    target_unit = models.CharField(max_length=100)  # e.g., "USD", "Percentage", "Headcount"
    
    current_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    actual_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    target_completion_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    
    responsible_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    status = models.CharField(max_length=50, choices=[
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('on_track', 'On Track'),
        ('at_risk', 'At Risk'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ], default='planned')
    
    progress_percentage = models.IntegerField(default=0)  # 0-100
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['target_completion_date']
        verbose_name = 'Financial Goal'
        verbose_name_plural = 'Financial Goals'
    
    def __str__(self):
        return f"{self.goal_name} - {self.status}"
