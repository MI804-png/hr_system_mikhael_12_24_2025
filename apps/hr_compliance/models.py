from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.employees.models import Employee
from apps.core.models import Department


class RegulationCategory(models.Model):
    """Categories of HR regulations and laws"""
    ANTI_DISCRIMINATION = 'ANTI_DISCRIMINATION'
    COMPENSATION_HOURS = 'COMPENSATION_HOURS'
    LEAVE_BENEFITS = 'LEAVE_BENEFITS'
    WORKPLACE_SAFETY = 'WORKPLACE_SAFETY'
    DATA_PROTECTION = 'DATA_PROTECTION'
    OTHER = 'OTHER'

    CATEGORY_CHOICES = [
        (ANTI_DISCRIMINATION, 'Anti-Discrimination Laws'),
        (COMPENSATION_HOURS, 'Compensation & Hours'),
        (LEAVE_BENEFITS, 'Leave & Benefits'),
        (WORKPLACE_SAFETY, 'Workplace Safety'),
        (DATA_PROTECTION, 'Data Protection'),
        (OTHER, 'Other'),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    category_type = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    federal_level = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category_type', 'name']
        verbose_name_plural = 'Regulation Categories'

    def __str__(self):
        return f"{self.name} ({self.get_category_type_display()})"


class Regulation(models.Model):
    """Specific HR laws and regulations"""
    FEDERAL = 'FEDERAL'
    STATE = 'STATE'
    LOCAL = 'LOCAL'

    JURISDICTION_CHOICES = [
        (FEDERAL, 'Federal'),
        (STATE, 'State'),
        (LOCAL, 'Local'),
    ]

    ACTIVE = 'ACTIVE'
    PENDING = 'PENDING'
    ARCHIVED = 'ARCHIVED'

    STATUS_CHOICES = [
        (ACTIVE, 'Active'),
        (PENDING, 'Pending'),
        (ARCHIVED, 'Archived'),
    ]

    name = models.CharField(max_length=255)
    official_name = models.CharField(max_length=255, blank=True)
    category = models.ForeignKey(RegulationCategory, on_delete=models.PROTECT, related_name='regulations')
    jurisdiction = models.CharField(max_length=20, choices=JURISDICTION_CHOICES)
    jurisdiction_location = models.CharField(max_length=100, blank=True, help_text='e.g., California, New York')
    description = models.TextField()
    key_requirements = models.JSONField(default=list, help_text='List of key compliance requirements')
    applicable_industries = models.JSONField(default=list, blank=True, help_text='Industries this applies to')
    affected_employees = models.CharField(max_length=255, blank=True, help_text='e.g., All employees, Remote workers')
    effective_date = models.DateField()
    last_updated = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    penalty_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    reference_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'jurisdiction', 'name']
        unique_together = ['name', 'jurisdiction_location']

    def __str__(self):
        return f"{self.name} ({self.jurisdiction_location or self.jurisdiction})"


class HRPolicy(models.Model):
    """Company HR policies"""
    CONDUCT = 'CONDUCT'
    OPERATIONAL = 'OPERATIONAL'
    SAFETY = 'SAFETY'
    COMPENSATION = 'COMPENSATION'
    BENEFITS = 'BENEFITS'
    OTHER = 'OTHER'

    POLICY_TYPE_CHOICES = [
        (CONDUCT, 'Conduct & Ethics'),
        (OPERATIONAL, 'Operational'),
        (SAFETY, 'Safety'),
        (COMPENSATION, 'Compensation'),
        (BENEFITS, 'Benefits'),
        (OTHER, 'Other'),
    ]

    DRAFT = 'DRAFT'
    APPROVED = 'APPROVED'
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'

    STATUS_CHOICES = [
        (DRAFT, 'Draft'),
        (APPROVED, 'Approved'),
        (ACTIVE, 'Active'),
        (INACTIVE, 'Inactive'),
    ]

    title = models.CharField(max_length=255)
    policy_type = models.CharField(max_length=50, choices=POLICY_TYPE_CHOICES)
    description = models.TextField()
    content = models.TextField()
    related_regulations = models.ManyToManyField(Regulation, blank=True, related_name='policies')
    is_mandatory = models.BooleanField(default=True, help_text='Requires acknowledgment')
    applies_to = models.CharField(max_length=255, blank=True, help_text='e.g., All employees, Managers, Remote workers')
    effective_date = models.DateField()
    last_revised_date = models.DateField()
    version = models.CharField(max_length=20, default='1.0')
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_policies')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)
    approval_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_date', 'policy_type', 'title']
        unique_together = ['title', 'version']

    def __str__(self):
        return f"{self.title} (v{self.version})"


class PolicyAcknowledgment(models.Model):
    """Track employee acknowledgment of policies"""
    ACKNOWLEDGED = 'ACKNOWLEDGED'
    PENDING = 'PENDING'
    DECLINED = 'DECLINED'

    STATUS_CHOICES = [
        (ACKNOWLEDGED, 'Acknowledged'),
        (PENDING, 'Pending'),
        (DECLINED, 'Declined'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='policy_acknowledgments')
    policy = models.ForeignKey(HRPolicy, on_delete=models.CASCADE, related_name='acknowledgments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    acknowledged_date = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['employee', 'policy']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['policy', 'status']),
            models.Index(fields=['acknowledged_date']),
        ]

    def __str__(self):
        return f"{self.employee} - {self.policy} ({self.status})"


class ComplianceTraining(models.Model):
    """Track mandatory compliance training"""
    REQUIRED = 'REQUIRED'
    RECOMMENDED = 'RECOMMENDED'

    REQUIREMENT_CHOICES = [
        (REQUIRED, 'Required'),
        (RECOMMENDED, 'Recommended'),
    ]

    SCHEDULED = 'SCHEDULED'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'
    EXPIRED = 'EXPIRED'

    STATUS_CHOICES = [
        (SCHEDULED, 'Scheduled'),
        (IN_PROGRESS, 'In Progress'),
        (COMPLETED, 'Completed'),
        (EXPIRED, 'Expired'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    regulation = models.ForeignKey(Regulation, on_delete=models.SET_NULL, null=True, blank=True, related_name='trainings')
    requirement_type = models.CharField(max_length=20, choices=REQUIREMENT_CHOICES, default=REQUIRED)
    training_frequency_months = models.IntegerField(help_text='How often training must be completed')
    duration_minutes = models.IntegerField(help_text='Expected training duration')
    content_url = models.URLField(blank=True)
    provider = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']
        unique_together = ['title', 'regulation']

    def __str__(self):
        return f"{self.title} ({self.get_requirement_type_display()})"


class TrainingCompletion(models.Model):
    """Track employee compliance training completion"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='training_completions')
    training = models.ForeignKey(ComplianceTraining, on_delete=models.CASCADE, related_name='completions')
    scheduled_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=ComplianceTraining.STATUS_CHOICES, default=ComplianceTraining.SCHEDULED)
    score = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    passed = models.BooleanField(null=True, blank=True)
    certificate_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_date']
        unique_together = ['employee', 'training', 'scheduled_date']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['training', 'status']),
            models.Index(fields=['completion_date']),
            models.Index(fields=['next_due_date']),
        ]

    def __str__(self):
        return f"{self.employee} - {self.training.title} ({self.status})"


class ComplianceAudit(models.Model):
    """Track compliance audits and assessments"""
    SCHEDULED = 'SCHEDULED'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'

    STATUS_CHOICES = [
        (SCHEDULED, 'Scheduled'),
        (IN_PROGRESS, 'In Progress'),
        (COMPLETED, 'Completed'),
    ]

    title = models.CharField(max_length=255)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='compliance_audits')
    scope = models.TextField(help_text='What areas/regulations this audit covers')
    regulations_audited = models.ManyToManyField(Regulation, related_name='audits')
    scheduled_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=SCHEDULED)
    auditor = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='conducted_audits')
    findings = models.JSONField(default=dict, blank=True, help_text='Findings and issues discovered')
    recommendations = models.JSONField(default=list, blank=True)
    overall_compliance_score = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    report_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['status', 'scheduled_date']),
            models.Index(fields=['department', 'status']),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class ComplianceIncident(models.Model):
    """Report and track compliance violations and incidents"""
    REPORTED = 'REPORTED'
    INVESTIGATING = 'INVESTIGATING'
    RESOLVED = 'RESOLVED'
    ESCALATED = 'ESCALATED'

    STATUS_CHOICES = [
        (REPORTED, 'Reported'),
        (INVESTIGATING, 'Investigating'),
        (RESOLVED, 'Resolved'),
        (ESCALATED, 'Escalated'),
    ]

    CRITICAL = 'CRITICAL'
    HIGH = 'HIGH'
    MEDIUM = 'MEDIUM'
    LOW = 'LOW'

    SEVERITY_CHOICES = [
        (CRITICAL, 'Critical'),
        (HIGH, 'High'),
        (MEDIUM, 'Medium'),
        (LOW, 'Low'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    violation_type = models.CharField(max_length=255, help_text='e.g., Discrimination, Wage Violation, Safety Breach')
    regulation_violated = models.ForeignKey(Regulation, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidents')
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='compliance_incidents')
    reported_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='incidents_reported')
    reported_date = models.DateTimeField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=MEDIUM)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=REPORTED)
    investigation_notes = models.TextField(blank=True)
    resolution = models.TextField(blank=True)
    resolution_date = models.DateField(null=True, blank=True)
    corrective_actions = models.JSONField(default=list, blank=True)
    legal_review_required = models.BooleanField(default=False)
    escalated_to_legal = models.BooleanField(default=False)
    potential_penalty = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-reported_date']
        indexes = [
            models.Index(fields=['status', 'severity']),
            models.Index(fields=['reported_date']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return f"{self.title} ({self.severity})"


class ComplianceDashboard(models.Model):
    """Summary metrics for compliance status"""
    department = models.OneToOneField(Department, on_delete=models.CASCADE, related_name='compliance_dashboard')
    total_policies = models.IntegerField(default=0)
    acknowledged_policies = models.IntegerField(default=0)
    pending_acknowledgments = models.IntegerField(default=0)
    required_trainings = models.IntegerField(default=0)
    completed_trainings = models.IntegerField(default=0)
    overdue_trainings = models.IntegerField(default=0)
    open_incidents = models.IntegerField(default=0)
    critical_incidents = models.IntegerField(default=0)
    audit_compliance_score = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    last_audit_date = models.DateField(null=True, blank=True)
    compliance_status = models.CharField(max_length=50, default='PENDING')  # COMPLIANT, NON_COMPLIANT, REVIEW_NEEDED
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Compliance Dashboards'

    def __str__(self):
        return f"Compliance Dashboard - {self.department.name}"
