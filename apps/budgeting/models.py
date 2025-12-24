from django.db import models
from django.contrib.auth.models import User
from apps.core.models import Department
from decimal import Decimal


class BudgetCategory(models.Model):
    """Budget spending categories"""
    CATEGORY_CHOICES = [
        ('salaries', 'Salaries & Wages'),
        ('recruitment', 'Recruitment'),
        ('training', 'Training & Development'),
        ('benefits', 'Benefits & Insurance'),
        ('facilities', 'Facilities & Equipment'),
        ('technology', 'Technology & Software'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Budget Category'
        verbose_name_plural = 'Budget Categories'
    
    def __str__(self):
        return self.name


class DepartmentBudget(models.Model):
    """Annual or quarterly budget allocation by department"""
    FISCAL_PERIOD_CHOICES = [
        ('annual', 'Annual'),
        ('quarterly', 'Quarterly'),
        ('monthly', 'Monthly'),
    ]
    
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='budgets')
    fiscal_year = models.IntegerField()
    fiscal_period = models.CharField(max_length=20, choices=FISCAL_PERIOD_CHOICES, default='annual')
    period_start = models.DateField()
    period_end = models.DateField()
    
    total_budget = models.DecimalField(max_digits=15, decimal_places=2)
    contingency_reserve = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='budgets_created')
    
    class Meta:
        ordering = ['-fiscal_year', '-period_start']
        verbose_name = 'Department Budget'
        verbose_name_plural = 'Department Budgets'
        unique_together = ('department', 'fiscal_year', 'fiscal_period')
    
    def __str__(self):
        return f"{self.department.name} - FY{self.fiscal_year}"


class BudgetAllocation(models.Model):
    """Detailed budget allocation for each category within a department budget"""
    budget = models.ForeignKey(DepartmentBudget, on_delete=models.CASCADE, related_name='allocations')
    category = models.ForeignKey(BudgetCategory, on_delete=models.SET_NULL, null=True)
    
    allocated_amount = models.DecimalField(max_digits=15, decimal_places=2)
    actual_spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    remaining_budget = models.DecimalField(max_digits=15, decimal_places=2)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category']
        verbose_name = 'Budget Allocation'
        verbose_name_plural = 'Budget Allocations'
        unique_together = ('budget', 'category')
    
    def __str__(self):
        return f"{self.budget.department.name} - {self.category.name}"


class Expenditure(models.Model):
    """Track individual spending transactions"""
    EXPENDITURE_TYPE_CHOICES = [
        ('salary', 'Salary Payment'),
        ('benefits', 'Benefits Payment'),
        ('training', 'Training Expense'),
        ('recruitment', 'Recruitment Cost'),
        ('equipment', 'Equipment/Supplies'),
        ('travel', 'Travel Expense'),
        ('other', 'Other Expense'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('rejected', 'Rejected'),
    ]
    
    budget_allocation = models.ForeignKey(BudgetAllocation, on_delete=models.SET_NULL, null=True, related_name='expenditures')
    
    description = models.CharField(max_length=255)
    expenditure_type = models.CharField(max_length=50, choices=EXPENDITURE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    expense_date = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenditures_approved')
    approved_date = models.DateTimeField(null=True, blank=True)
    
    invoice_number = models.CharField(max_length=100, blank=True)
    vendor_name = models.CharField(max_length=255, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='expenditures_created')
    
    class Meta:
        ordering = ['-expense_date']
        verbose_name = 'Expenditure'
        verbose_name_plural = 'Expenditures'
    
    def __str__(self):
        return f"{self.description} - {self.amount}"


class BudgetForecast(models.Model):
    """Projected budget spending based on historical data"""
    budget = models.ForeignKey(DepartmentBudget, on_delete=models.CASCADE, related_name='forecasts')
    category = models.ForeignKey(BudgetCategory, on_delete=models.SET_NULL, null=True)
    
    projected_spending = models.DecimalField(max_digits=15, decimal_places=2)
    confidence_level = models.IntegerField(default=100)  # 0-100%
    forecast_method = models.CharField(max_length=100, blank=True)  # e.g., "Historical Average", "Linear Regression"
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='forecasts_created')
    
    class Meta:
        ordering = ['category']
        verbose_name = 'Budget Forecast'
        verbose_name_plural = 'Budget Forecasts'
    
    def __str__(self):
        return f"{self.budget.department.name} - {self.category.name} Forecast"


class BudgetReview(models.Model):
    """Budget reviews and variance analysis"""
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    budget = models.ForeignKey(DepartmentBudget, on_delete=models.CASCADE, related_name='reviews')
    
    review_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    total_allocated = models.DecimalField(max_digits=15, decimal_places=2)
    total_spent = models.DecimalField(max_digits=15, decimal_places=2)
    total_remaining = models.DecimalField(max_digits=15, decimal_places=2)
    variance_percentage = models.DecimalField(max_digits=5, decimal_places=2)  # Over/under budget
    
    summary = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='budget_reviews')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='budget_reviews_approved')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-review_date']
        verbose_name = 'Budget Review'
        verbose_name_plural = 'Budget Reviews'
    
    def __str__(self):
        return f"Budget Review - {self.budget.department.name} ({self.review_date})"
