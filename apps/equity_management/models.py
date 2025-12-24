from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from datetime import datetime, timedelta

from apps.employees.models import Employee
from apps.core.models import Department


class StockOptionPlan(models.Model):
    """Master stock option plan configuration"""
    PLAN_TYPE_CHOICES = [
        ('ISO', 'Incentive Stock Option'),
        ('NSO', 'Non-Qualified Stock Option'),
        ('RSU', 'Restricted Stock Unit'),
        ('PSU', 'Performance Stock Unit'),
    ]

    name = models.CharField(max_length=255)
    plan_type = models.CharField(max_length=10, choices=PLAN_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Plan details
    strike_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    shares_authorized = models.BigIntegerField(validators=[MinValueValidator(0)])
    shares_issued = models.BigIntegerField(default=0)
    
    # Tax and regulatory
    exercise_window_years = models.IntegerField(default=10)
    tax_treatment = models.CharField(max_length=100, blank=True)
    plan_document_url = models.URLField(blank=True)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'equity_stock_option_plan'
        indexes = [
            models.Index(fields=['plan_type', 'is_active']),
            models.Index(fields=['start_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()})"
    
    @property
    def shares_available(self):
        """Calculate available shares for new grants"""
        return self.shares_authorized - self.shares_issued


class EquityGrant(models.Model):
    """Individual equity grants to employees"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('GRANTED', 'Granted'),
        ('VESTING', 'Vesting'),
        ('VESTED', 'Fully Vested'),
        ('CANCELLED', 'Cancelled'),
        ('EXERCISED', 'Exercised'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='equity_grants')
    plan = models.ForeignKey(StockOptionPlan, on_delete=models.CASCADE)
    
    grant_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Grant terms
    grant_date = models.DateField()
    number_of_shares = models.BigIntegerField(validators=[MinValueValidator(1)])
    grant_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    
    # Vesting schedule
    vesting_start_date = models.DateField()
    vesting_end_date = models.DateField()
    cliff_months = models.IntegerField(default=12, help_text="Months until first vesting tranche")
    vesting_schedule = models.CharField(max_length=100, default='4-year')  # e.g., "4-year, 1-year cliff"
    
    # Tracking
    shares_vested = models.BigIntegerField(default=0)
    shares_exercised = models.BigIntegerField(default=0)
    
    # Financial
    grant_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_fair_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Details
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    
    # Approval
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='equity_grants_approved', blank=True)
    approved_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equity_grant'
        unique_together = ['employee', 'grant_number']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['grant_date']),
            models.Index(fields=['vesting_end_date']),
        ]

    def __str__(self):
        return f"{self.grant_number} - {self.employee}"
    
    @property
    def shares_available_to_exercise(self):
        """Shares that have vested and not yet exercised"""
        return self.shares_vested - self.shares_exercised
    
    @property
    def vesting_percentage(self):
        """Current vesting percentage"""
        if self.number_of_shares == 0:
            return 0
        return (self.shares_vested / self.number_of_shares) * 100


class VestingSchedule(models.Model):
    """Track individual vesting events"""
    grant = models.ForeignKey(EquityGrant, on_delete=models.CASCADE, related_name='vesting_events')
    
    vesting_date = models.DateField()
    shares_to_vest = models.BigIntegerField(validators=[MinValueValidator(1)])
    
    is_vested = models.BooleanField(default=False)
    vested_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'equity_vesting_schedule'
        ordering = ['vesting_date']
        indexes = [
            models.Index(fields=['grant', 'vesting_date']),
            models.Index(fields=['is_vested']),
        ]

    def __str__(self):
        return f"Vest {self.shares_to_vest} shares on {self.vesting_date}"


class EquityExercise(models.Model):
    """Track stock option exercises"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    grant = models.ForeignKey(EquityGrant, on_delete=models.CASCADE, related_name='exercises')
    
    exercise_date = models.DateField()
    shares_exercised = models.BigIntegerField(validators=[MinValueValidator(1)])
    exercise_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # shares * price
    
    exercise_method = models.CharField(max_length=50, blank=True)  # e.g., "cash", "cashless", "broker-assisted"
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='equity_exercises_approved', blank=True)
    approved_date = models.DateField(null=True, blank=True)
    
    completed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equity_exercise'
        indexes = [
            models.Index(fields=['grant', 'exercise_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Exercise {self.shares_exercised} shares on {self.exercise_date}"


class ESOP(models.Model):
    """Employee Stock Ownership Plan"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
    ]

    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # ESOP details
    total_shares_authorized = models.BigIntegerField()
    shares_allocated = models.BigIntegerField(default=0)
    
    contribution_limit_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('6.00'),
        validators=[MinValueValidator(Decimal('0.01')), MaxValueValidator(Decimal('100.00'))]
    )
    
    # Eligibility
    minimum_tenure_months = models.IntegerField(default=12)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equity_esop'

    def __str__(self):
        return self.name
    
    @property
    def shares_available(self):
        return self.total_shares_authorized - self.shares_allocated


class ESOPParticipant(models.Model):
    """Employee participation in ESOP"""
    STATUS_CHOICES = [
        ('ELIGIBLE', 'Eligible'),
        ('ENROLLED', 'Enrolled'),
        ('WITHDRAWN', 'Withdrawn'),
    ]

    esop = models.ForeignKey(ESOP, on_delete=models.CASCADE, related_name='participants')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='esop_participations')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ELIGIBLE')
    
    shares_owned = models.BigIntegerField(default=0)
    total_contributions = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    enrollment_date = models.DateField(null=True, blank=True)
    withdrawal_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equity_esop_participant'
        unique_together = ['esop', 'employee']
        indexes = [
            models.Index(fields=['esop', 'status']),
        ]

    def __str__(self):
        return f"{self.employee} - {self.esop}"


class EquityReport(models.Model):
    """Track equity awards and valuations for financial reporting"""
    REPORT_TYPE_CHOICES = [
        ('SUMMARY', 'Summary Report'),
        ('DETAILED', 'Detailed Report'),
        ('AUDIT', 'Audit Report'),
        ('ACCOUNTING', 'Accounting/ASC718 Report'),
    ]

    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    report_date = models.DateField()
    
    total_shares_outstanding = models.BigIntegerField()
    total_awards_value = models.DecimalField(max_digits=18, decimal_places=2)
    
    expense_recognition = models.DecimalField(max_digits=18, decimal_places=2, help_text="ASC 718 expense recognition")
    
    file_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'equity_report'
        ordering = ['-report_date']
        indexes = [
            models.Index(fields=['report_type', 'report_date']),
        ]

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.report_date}"
