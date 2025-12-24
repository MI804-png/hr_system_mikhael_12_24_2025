from django.db import models
from django.utils import timezone
from apps.employees.models import Employee
from django.contrib.auth.models import User

class CompanyPolicy(models.Model):
    POLICY_TYPES = [
        ('attendance', 'Attendance'),
        ('conduct', 'Conduct'),
        ('security', 'Security'),
        ('data_protection', 'Data Protection'),
        ('health_safety', 'Health & Safety'),
        ('harassment', 'Anti-Harassment'),
        ('code_of_conduct', 'Code of Conduct'),
        ('remote_work', 'Remote Work'),
        ('pto', 'PTO/Leave'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=255)
    policy_type = models.CharField(max_length=50, choices=POLICY_TYPES)
    description = models.TextField()
    
    full_text = models.TextField()
    
    version = models.CharField(max_length=20, default='1.0')
    
    effective_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_policies')
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.title} (v{self.version})"


class PolicyAcknowledgment(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='policy_acknowledgments')
    policy = models.ForeignKey(CompanyPolicy, on_delete=models.CASCADE)
    
    acknowledged_date = models.DateTimeField()
    
    class Meta:
        unique_together = ('employee', 'policy')
        ordering = ['-acknowledged_date']
    
    def __str__(self):
        return f"{self.employee} - {self.policy}"


class DisciplinaryAction(models.Model):
    ACTION_TYPES = [
        ('warning', 'Verbal Warning'),
        ('written_warning', 'Written Warning'),
        ('suspension', 'Suspension'),
        ('demotion', 'Demotion'),
        ('termination', 'Termination'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='disciplinary_actions')
    
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    
    reason = models.TextField()
    description = models.TextField()
    
    action_date = models.DateField()
    
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_disciplinary_actions')
    
    effective_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # For suspension end date
    
    appeal_submitted = models.BooleanField(default=False)
    appeal_date = models.DateField(null=True, blank=True)
    appeal_outcome = models.CharField(max_length=255, blank=True)
    
    documents = models.FileField(upload_to='disciplinary_actions/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-action_date']
    
    def __str__(self):
        return f"{self.employee} - {self.get_action_type_display()}"


class ComplianceRecord(models.Model):
    RECORD_TYPES = [
        ('labor_law', 'Labor Law Compliance'),
        ('tax', 'Tax Compliance'),
        ('data_protection', 'Data Protection'),
        ('workplace_safety', 'Workplace Safety'),
        ('audit', 'Audit'),
        ('inspection', 'Inspection'),
        ('certification', 'Certification'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('compliant', 'Compliant'),
        ('non_compliant', 'Non-Compliant'),
        ('in_progress', 'In Progress'),
        ('remedial_action', 'Remedial Action Required'),
    ]
    
    title = models.CharField(max_length=255)
    record_type = models.CharField(max_length=50, choices=RECORD_TYPES)
    
    description = models.TextField()
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='in_progress')
    
    check_date = models.DateField()
    due_date = models.DateField()
    
    findings = models.TextField(blank=True)
    remedial_actions = models.TextField(blank=True)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    documents = models.FileField(upload_to='compliance_records/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-check_date']
    
    def __str__(self):
        return f"{self.title} - {self.status}"


class AuditLog(models.Model):
    AUDIT_TYPES = [
        ('access', 'Access'),
        ('modification', 'Modification'),
        ('deletion', 'Deletion'),
        ('export', 'Data Export'),
        ('login', 'Login'),
        ('permission_change', 'Permission Change'),
    ]
    
    audit_type = models.CharField(max_length=50, choices=AUDIT_TYPES)
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    action = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    affected_module = models.CharField(max_length=100)
    affected_record_id = models.IntegerField(null=True, blank=True)
    
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['affected_module', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.audit_type} - {self.user} - {self.timestamp}"


class LaborLawCompliance(models.Model):
    name = models.CharField(max_length=255)
    jurisdiction = models.CharField(max_length=100)
    
    description = models.TextField()
    requirements = models.TextField()
    
    applicable_to_roles = models.CharField(max_length=255, help_text="Comma-separated list of applicable roles")
    
    last_review_date = models.DateField()
    next_review_date = models.DateField()
    
    compliance_status = models.CharField(max_length=50, choices=[
        ('compliant', 'Compliant'),
        ('non_compliant', 'Non-Compliant'),
        ('needs_review', 'Needs Review'),
    ])
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['jurisdiction', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.jurisdiction})"


class RiskAssessment(models.Model):
    RISK_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    risk_area = models.CharField(max_length=100, choices=[
        ('operational', 'Operational'),
        ('financial', 'Financial'),
        ('legal', 'Legal'),
        ('reputational', 'Reputational'),
        ('compliance', 'Compliance'),
        ('security', 'Security'),
    ])
    
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS)
    
    probability = models.IntegerField(help_text="1-5 scale")
    impact = models.IntegerField(help_text="1-5 scale")
    
    assessment_date = models.DateField()
    
    mitigation_strategy = models.TextField()
    responsible_person = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    target_resolution_date = models.DateField()
    
    status = models.CharField(max_length=50, choices=[
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('monitored', 'Monitored'),
    ], default='open')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-assessment_date']
    
    def __str__(self):
        return f"{self.title} - {self.risk_level}"
