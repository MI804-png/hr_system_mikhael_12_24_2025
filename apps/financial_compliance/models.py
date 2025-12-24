from django.db import models
from django.contrib.auth.models import User
from apps.employees.models import Employee
# from apps.compliance.models import DisciplinaryAction  # Handled separately


class FinancialAuditLog(models.Model):
    """Audit trail for all financial transactions"""
    TRANSACTION_TYPE_CHOICES = [
        ('paycheck', 'Paycheck'),
        ('bonus', 'Bonus'),
        ('raise', 'Raise'),
        ('expenditure', 'Expenditure'),
        ('reimbursement', 'Reimbursement'),
        ('deduction', 'Deduction'),
        ('tax_payment', 'Tax Payment'),
        ('other', 'Other'),
    ]
    
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('modified', 'Modified'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
        ('voided', 'Voided'),
        ('reversal', 'Reversal'),
    ]
    
    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPE_CHOICES)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    transaction_id = models.CharField(max_length=100)  # References related transaction
    
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField()
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    previous_value = models.TextField(blank=True)  # JSON of what changed
    new_value = models.TextField(blank=True)
    
    is_compliant = models.BooleanField(default=True)
    compliance_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Financial Audit Log'
        verbose_name_plural = 'Financial Audit Logs'
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['employee', '-timestamp']),
            models.Index(fields=['transaction_type']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.timestamp}"


class ComplianceRecord(models.Model):
    """Track compliance with labor laws and regulations"""
    COMPLIANCE_TYPE_CHOICES = [
        ('minimum_wage', 'Minimum Wage Compliance'),
        ('overtime', 'Overtime Laws'),
        ('payroll_tax', 'Payroll Tax Compliance'),
        ('benefits', 'Benefits Compliance'),
        ('pto', 'PTO/Leave Compliance'),
        ('termination', 'Termination Compliance'),
        ('child_labor', 'Child Labor Laws'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('compliant', 'Compliant'),
        ('non_compliant', 'Non-Compliant'),
        ('warning', 'Warning'),
        ('pending_review', 'Pending Review'),
    ]
    
    compliance_type = models.CharField(max_length=50, choices=COMPLIANCE_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_review')
    
    regulation = models.CharField(max_length=255)  # e.g., "FLSA", "FICA", "State Minimum Wage"
    jurisdiction = models.CharField(max_length=100)  # e.g., "Federal", "California", "New York"
    
    description = models.TextField()
    affected_employees = models.IntegerField(default=0)
    
    review_date = models.DateField()
    last_checked_date = models.DateField(auto_now=True)
    
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='compliance_reviews')
    
    # For non-compliance
    remediation_required = models.BooleanField(default=False)
    remediation_plan = models.TextField(blank=True)
    remediation_deadline = models.DateField(null=True, blank=True)
    remediation_completed_date = models.DateField(null=True, blank=True)
    
    # For penalties/fines
    potential_penalty = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    actual_penalty = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    penalty_paid_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-review_date']
        verbose_name = 'Compliance Record'
        verbose_name_plural = 'Compliance Records'
    
    def __str__(self):
        return f"{self.get_compliance_type_display()} - {self.status}"


class TaxFilingRecord(models.Model):
    """Track tax filing and payment records"""
    FILING_TYPE_CHOICES = [
        ('federal_941', 'Form 941 (Federal)'),
        ('state_income', 'State Income Tax'),
        ('federal_940', 'Form 940 (FUTA)'),
        ('9401', 'Form 9401 (SUTA)'),
        ('1099', 'Form 1099'),
        ('w2', 'Form W2'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('amended', 'Amended'),
        ('paid', 'Paid'),
    ]
    
    filing_type = models.CharField(max_length=50, choices=FILING_TYPE_CHOICES)
    filing_period = models.CharField(max_length=20)  # e.g., "Q1 2024", "Monthly Jan 2024"
    
    total_taxable_wages = models.DecimalField(max_digits=15, decimal_places=2)
    total_tax_withheld = models.DecimalField(max_digits=15, decimal_places=2)
    total_tax_due = models.DecimalField(max_digits=15, decimal_places=2)
    total_tax_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    due_date = models.DateField()
    filed_date = models.DateField(null=True, blank=True)
    paid_date = models.DateField(null=True, blank=True)
    
    # Filing details
    confirmation_number = models.CharField(max_length=100, blank=True)
    filing_reference = models.CharField(max_length=255, blank=True)
    
    # Penalties and interest
    late_penalty = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interest = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    filed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-due_date']
        verbose_name = 'Tax Filing Record'
        verbose_name_plural = 'Tax Filing Records'
    
    def __str__(self):
        return f"{self.get_filing_type_display()} - {self.filing_period}"


class FinancialRiskAssessment(models.Model):
    """Assess financial risks from HR operations"""
    RISK_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    risk_category = models.CharField(max_length=100)  # e.g., "Turnover Cost", "Misclassification"
    description = models.TextField()
    
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES)
    probability = models.IntegerField(default=50)  # 0-100%
    potential_impact = models.DecimalField(max_digits=15, decimal_places=2)  # Financial impact
    
    affected_area = models.CharField(max_length=255)  # e.g., "Engineering Department", "Payroll"
    number_of_employees = models.IntegerField(default=0)
    
    # Mitigation
    mitigation_strategy = models.TextField(blank=True)
    mitigation_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    mitigation_deadline = models.DateField(null=True, blank=True)
    mitigation_status = models.CharField(max_length=50, choices=[
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ], default='not_started')
    
    assessment_date = models.DateField()
    review_date = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='risk_assessments_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-assessment_date']
        verbose_name = 'Financial Risk Assessment'
        verbose_name_plural = 'Financial Risk Assessments'
    
    def __str__(self):
        return f"{self.risk_category} - {self.get_risk_level_display()}"


class TerminationFinancials(models.Model):
    """Track financial aspects of employee terminations"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='termination_financials')
    # disciplinary_action = models.ForeignKey(DisciplinaryAction, on_delete=models.SET_NULL, null=True, blank=True)
    
    termination_date = models.DateField()
    termination_reason = models.CharField(max_length=255)
    
    # Final pay
    final_paycheck_amount = models.DecimalField(max_digits=12, decimal_places=2)
    final_paycheck_date = models.DateField()
    final_paycheck_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Accrued benefits
    accrued_pto_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    accrued_sick_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonus_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Benefits continuation
    cobra_election = models.BooleanField(default=False)
    cobra_premium_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cobra_payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, null=True, blank=True)
    
    # Severance
    severance_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    severance_approved = models.BooleanField(default=False)
    
    # Clawback/recovery (if applicable)
    clawback_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    clawback_reason = models.TextField(blank=True)
    
    total_owed_to_company = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_owed_to_employee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Legal/documentation
    separation_agreement_signed = models.BooleanField(default=False)
    signed_date = models.DateField(null=True, blank=True)
    dispute_filed = models.BooleanField(default=False)
    dispute_details = models.TextField(blank=True)
    
    # Processing status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    processed_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Termination Financial Record'
        verbose_name_plural = 'Termination Financial Records'
    
    def __str__(self):
        return f"{self.employee.user.username} Termination - {self.termination_date}"
