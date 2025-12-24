from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

from apps.employees.models import Employee
from apps.core.models import Department


class ESGObjective(models.Model):
    """Environmental, Social, Governance objectives"""
    CATEGORY_CHOICES = [
        ('ENVIRONMENTAL', 'Environmental'),
        ('SOCIAL', 'Social'),
        ('GOVERNANCE', 'Governance'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    target_value = models.DecimalField(max_digits=15, decimal_places=2)
    target_unit = models.CharField(max_length=100)  # e.g., "tonnes", "people", "hours"
    
    current_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    start_date = models.DateField()
    target_date = models.DateField()
    
    owner = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='esg_objectives')
    
    status = models.CharField(
        max_length=20,
        choices=[('ON_TRACK', 'On Track'), ('AT_RISK', 'At Risk'), ('COMPLETED', 'Completed'), ('DEFERRED', 'Deferred')],
        default='ON_TRACK'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'csr_esg_objective'
        ordering = ['-priority', 'target_date']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['target_date']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage"""
        if self.target_value == 0:
            return 0
        return min((self.current_value / self.target_value) * 100, 100)


class VolunteerProgram(models.Model):
    """Employee volunteer programs and initiatives"""
    STATUS_CHOICES = [
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField()
    cause_area = models.CharField(max_length=100)  # e.g., "Education", "Environment", "Health"
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING')
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    target_hours = models.IntegerField(validators=[MinValueValidator(0)])
    actual_hours = models.IntegerField(default=0)
    
    participating_employees = models.ManyToManyField(Employee, related_name='volunteer_programs')
    
    partner_organization = models.CharField(max_length=255, blank=True)
    impact_description = models.TextField(blank=True)
    
    manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='managed_volunteer_programs')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'csr_volunteer_program'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['cause_area']),
        ]

    def __str__(self):
        return self.name
    
    @property
    def hours_remaining(self):
        return max(self.target_hours - self.actual_hours, 0)
    
    @property
    def participation_rate(self):
        """Percentage of target hours achieved"""
        if self.target_hours == 0:
            return 0
        return (self.actual_hours / self.target_hours) * 100


class EmployeeVolunteerLog(models.Model):
    """Track individual volunteer hours"""
    volunteer_program = models.ForeignKey(VolunteerProgram, on_delete=models.CASCADE, related_name='volunteer_logs')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='volunteer_logs')
    
    volunteer_date = models.DateField()
    hours = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.5'))])
    
    activities = models.TextField()
    
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='approved_volunteer_logs', blank=True)
    approved_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'csr_employee_volunteer_log'
        ordering = ['-volunteer_date']
        indexes = [
            models.Index(fields=['volunteer_program', 'employee']),
            models.Index(fields=['volunteer_date']),
        ]

    def __str__(self):
        return f"{self.employee} - {self.hours} hours - {self.volunteer_date}"


class SustainabilityInitiative(models.Model):
    """Environmental and social sustainability projects"""
    STATUS_CHOICES = [
        ('PROPOSED', 'Proposed'),
        ('APPROVED', 'Approved'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField()
    
    initiative_type = models.CharField(max_length=100)  # e.g., "Carbon Reduction", "Waste Management", "Energy Efficiency"
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROPOSED')
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Goals and metrics
    baseline_value = models.DecimalField(max_digits=15, decimal_places=2)
    baseline_unit = models.CharField(max_length=100)
    target_reduction_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    current_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Budget
    budget_allocated = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    budget_spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    owner = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='sustainability_initiatives')
    departments = models.ManyToManyField(Department, related_name='sustainability_initiatives')
    
    expected_impact = models.TextField(blank=True)
    actual_impact = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'csr_sustainability_initiative'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['initiative_type']),
        ]

    def __str__(self):
        return self.name
    
    @property
    def reduction_percentage_achieved(self):
        """Actual reduction percentage achieved"""
        if self.baseline_value == 0:
            return 0
        reduction = self.baseline_value - self.current_value
        return (reduction / self.baseline_value) * 100
    
    @property
    def budget_utilization(self):
        """Percentage of budget used"""
        if self.budget_allocated == 0:
            return 0
        return (self.budget_spent / self.budget_allocated) * 100


class DiversityMetric(models.Model):
    """Track diversity and inclusion metrics"""
    METRIC_TYPE_CHOICES = [
        ('GENDER', 'Gender Distribution'),
        ('ETHNICITY', 'Ethnicity Distribution'),
        ('AGE', 'Age Distribution'),
        ('DISABILITY', 'Disability Status'),
        ('LGBTQ', 'LGBTQ+ Status'),
        ('VETERAN', 'Veteran Status'),
        ('INTERNATIONAL', 'International Employees'),
    ]

    metric_type = models.CharField(max_length=20, choices=METRIC_TYPE_CHOICES)
    report_date = models.DateField()
    
    category = models.CharField(max_length=100)  # e.g., "Male", "Female", "Non-Binary"
    count = models.IntegerField(validators=[MinValueValidator(0)])
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    target_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'csr_diversity_metric'
        unique_together = ['metric_type', 'report_date', 'category']
        ordering = ['-report_date', 'metric_type']
        indexes = [
            models.Index(fields=['metric_type', 'report_date']),
        ]

    def __str__(self):
        return f"{self.get_metric_type_display()} - {self.category} ({self.report_date})"


class CommunityOutreach(models.Model):
    """Community engagement and outreach programs"""
    STATUS_CHOICES = [
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField()
    
    community_focus = models.CharField(max_length=100)  # e.g., "Youth", "Elderly", "Underserved Communities"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING')
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    target_beneficiaries = models.IntegerField(validators=[MinValueValidator(0)])
    actual_beneficiaries = models.IntegerField(default=0)
    
    budget_allocated = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    budget_spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    partner_organizations = models.TextField(blank=True, help_text="Comma-separated list of partner organizations")
    
    manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='managed_community_outreach')
    
    outcomes_description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'csr_community_outreach'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['status', 'start_date']),
        ]

    def __str__(self):
        return self.name
    
    @property
    def beneficiary_reach(self):
        """Percentage of beneficiaries reached"""
        if self.target_beneficiaries == 0:
            return 0
        return (self.actual_beneficiaries / self.target_beneficiaries) * 100


class CSRReport(models.Model):
    """Annual CSR and sustainability reports"""
    REPORT_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('REVIEW', 'Under Review'),
        ('PUBLISHED', 'Published'),
    ]

    title = models.CharField(max_length=255)
    report_year = models.IntegerField()
    
    status = models.CharField(max_length=20, choices=REPORT_STATUS_CHOICES, default='DRAFT')
    
    # Report contents
    esg_summary = models.TextField()
    environmental_metrics = models.TextField()
    social_metrics = models.TextField()
    governance_metrics = models.TextField()
    
    total_volunteer_hours = models.IntegerField(default=0)
    total_beneficiaries = models.IntegerField(default=0)
    
    carbon_footprint_reduction = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True)
    created_date = models.DateField(auto_now_add=True)
    published_date = models.DateField(null=True, blank=True)
    
    report_file_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'csr_csr_report'
        unique_together = ['title', 'report_year']
        ordering = ['-report_year']
        indexes = [
            models.Index(fields=['report_year', 'status']),
        ]

    def __str__(self):
        return f"{self.title} - {self.report_year}"
