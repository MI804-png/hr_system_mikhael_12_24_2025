from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

from apps.employees.models import Employee
from apps.core.models import Department, JobPosition


class RetentionRisk(models.Model):
    """Identify and track employee retention risks"""
    RISK_LEVEL_CHOICES = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Risk'),
    ]

    REASON_CHOICES = [
        ('LOW_ENGAGEMENT', 'Low Engagement'),
        ('CAREER_STAGNATION', 'Career Stagnation'),
        ('COMPENSATION', 'Compensation'),
        ('MANAGEMENT_ISSUES', 'Management Issues'),
        ('WORK_LIFE_BALANCE', 'Work-Life Balance'),
        ('SKILL_MISMATCH', 'Skill Mismatch'),
        ('RELOCATION', 'Relocation'),
        ('HEALTH_ISSUES', 'Health Issues'),
        ('FAMILY_REASONS', 'Family Reasons'),
        ('COMPANY_CULTURE', 'Company Culture'),
        ('CAREER_CHANGE', 'Career Change'),
        ('OTHER', 'Other'),
    ]

    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='retention_risk')
    
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='MEDIUM')
    primary_reason = models.CharField(max_length=50, choices=REASON_CHOICES, blank=True)
    
    risk_score = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        help_text="0-100 scale: 0 is no risk, 100 is certain departure"
    )
    
    assessment_date = models.DateField(auto_now=True)
    last_review_date = models.DateField(null=True, blank=True)
    
    description = models.TextField(blank=True)
    
    # Interventions
    intervention_planned = models.BooleanField(default=False)
    intervention_details = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'retention_risk'
        indexes = [
            models.Index(fields=['risk_level']),
            models.Index(fields=['employee']),
        ]

    def __str__(self):
        return f"{self.employee} - {self.get_risk_level_display()}"


class RetentionIntervention(models.Model):
    """Track retention improvement interventions"""
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('UNSUCCESSFUL', 'Unsuccessful'),
        ('CANCELLED', 'Cancelled'),
    ]

    INTERVENTION_TYPE_CHOICES = [
        ('PROMOTION', 'Promotion'),
        ('RAISE', 'Salary Increase'),
        ('BONUS', 'Bonus/Incentive'),
        ('MENTORING', 'Mentoring Program'),
        ('CAREER_DEVELOPMENT', 'Career Development'),
        ('FLEXIBILITY', 'Work Flexibility'),
        ('TEAM_CHANGE', 'Team Reassignment'),
        ('TRAINING', 'Training Program'),
        ('COUNSELING', 'Career Counseling'),
        ('RECOGNITION', 'Recognition'),
        ('OTHER', 'Other'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='retention_interventions')
    retention_risk = models.ForeignKey(RetentionRisk, on_delete=models.CASCADE, related_name='interventions', null=True)
    
    intervention_type = models.CharField(max_length=50, choices=INTERVENTION_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    description = models.TextField()
    
    budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    owner = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='managed_interventions')
    
    success_criteria = models.TextField(blank=True, help_text="Define success for this intervention")
    outcome = models.TextField(blank=True, help_text="Actual outcome of the intervention")
    
    was_successful = models.BooleanField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'retention_intervention'
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['intervention_type']),
        ]

    def __str__(self):
        return f"{self.employee} - {self.get_intervention_type_display()}"


class SuccessionPlan(models.Model):
    """Successor planning for critical roles"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('APPROVED', 'Approved'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
    ]

    position = models.ForeignKey(JobPosition, on_delete=models.CASCADE, related_name='succession_plans')
    
    current_employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='succession_plans_current')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    estimated_transition_date = models.DateField()
    reason_for_succession = models.CharField(max_length=255)  # e.g., "Retirement", "Promotion", "Voluntary departure"
    
    created_date = models.DateField(auto_now_add=True)
    last_reviewed_date = models.DateField(null=True, blank=True)
    
    # Succession readiness
    immediate_successors = models.ManyToManyField(Employee, related_name='immediate_succession_positions', blank=True)
    long_term_successors = models.ManyToManyField(Employee, through='SuccessionCandidate', related_name='long_term_succession_positions')
    
    transition_plan = models.TextField(blank=True, help_text="Detailed transition plan including knowledge transfer")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'retention_succession_plan'
        ordering = ['-estimated_transition_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['estimated_transition_date']),
        ]

    def __str__(self):
        return f"Succession Plan - {self.position}"


class SuccessionCandidate(models.Model):
    """Candidates for succession positions"""
    READINESS_CHOICES = [
        ('NOT_READY', 'Not Ready'),
        ('DEVELOPING', 'Developing'),
        ('READY_WITH_TRAINING', 'Ready with Additional Training'),
        ('READY', 'Ready Now'),
    ]

    succession_plan = models.ForeignKey(SuccessionPlan, on_delete=models.CASCADE, related_name='succession_candidates')
    candidate = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='succession_candidacies')
    
    readiness_level = models.CharField(max_length=30, choices=READINESS_CHOICES, default='DEVELOPING')
    
    years_in_company = models.IntegerField()
    years_in_current_role = models.IntegerField()
    
    experience_summary = models.TextField()
    gaps = models.TextField(blank=True, help_text="Skills or experience gaps")
    
    development_plan = models.TextField(blank=True, help_text="Plan to address gaps")
    
    priority = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)], help_text="1=highest priority")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'retention_succession_candidate'
        ordering = ['priority']
        unique_together = ['succession_plan', 'candidate']
        indexes = [
            models.Index(fields=['succession_plan', 'readiness_level']),
        ]

    def __str__(self):
        return f"{self.candidate} as successor for {self.succession_plan.position}"


class ExitInterview(models.Model):
    """Capture exit interview data"""
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='exit_interview')
    
    interview_date = models.DateField(auto_now_add=True)
    last_day_of_work = models.DateField()
    
    reason_for_leaving = models.CharField(
        max_length=100,
        choices=[
            ('VOLUNTARY', 'Voluntary Resignation'),
            ('TERMINATION', 'Termination'),
            ('RETIREMENT', 'Retirement'),
            ('RELOCATION', 'Relocation'),
            ('FAMILY', 'Family Reasons'),
            ('CAREER_CHANGE', 'Career Change'),
            ('FURTHER_EDUCATION', 'Further Education'),
            ('HEALTH', 'Health Reasons'),
            ('COMPENSATION', 'Compensation'),
            ('MANAGEMENT', 'Management Issues'),
            ('WORK_CULTURE', 'Work Culture'),
            ('NO_GROWTH', 'Lack of Growth Opportunity'),
            ('WORK_LIFE_BALANCE', 'Work-Life Balance'),
            ('OTHER', 'Other'),
        ]
    )
    
    # Experience assessment
    job_satisfaction = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True, blank=True,
        help_text="1-10 scale"
    )
    
    management_satisfaction = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True, blank=True,
        help_text="1-10 scale"
    )
    
    company_culture_fit = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True, blank=True,
        help_text="1-10 scale"
    )
    
    compensation_adequate = models.BooleanField(null=True, blank=True)
    benefits_adequate = models.BooleanField(null=True, blank=True)
    
    what_went_well = models.TextField(blank=True)
    what_could_improve = models.TextField(blank=True)
    would_recommend = models.BooleanField(null=True, blank=True, help_text="Would recommend company to others")
    
    suggestions = models.TextField(blank=True)
    
    # Follow-up
    forwarding_address = models.TextField(blank=True)
    rehire_eligible = models.BooleanField(default=True)
    
    notes = models.TextField(blank=True)
    
    conducted_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='conducted_exit_interviews')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'retention_exit_interview'
        indexes = [
            models.Index(fields=['reason_for_leaving']),
            models.Index(fields=['interview_date']),
        ]

    def __str__(self):
        return f"Exit Interview - {self.employee}"


class TurnoverAnalysis(models.Model):
    """Aggregate turnover data for analysis"""
    report_period = models.CharField(max_length=20)  # e.g., "2024-Q1", "2024-Jan"
    
    # Turnover metrics
    employees_at_start = models.IntegerField()
    employees_departed = models.IntegerField()
    new_hires = models.IntegerField()
    employees_at_end = models.IntegerField()
    
    # Rates and analysis
    turnover_rate = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Percentage of workforce that left"
    )
    
    voluntary_turnover = models.IntegerField(help_text="Number of voluntary departures")
    involuntary_turnover = models.IntegerField(help_text="Number of terminations")
    
    # Department breakdown (stored as JSON for flexibility)
    department_details = models.JSONField(default=dict, blank=True)
    
    # Cost analysis
    replacement_cost_per_employee = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_replacement_cost = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    top_departure_reason = models.CharField(max_length=100, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'retention_turnover_analysis'
        unique_together = ['report_period']
        ordering = ['-report_period']
        indexes = [
            models.Index(fields=['report_period']),
        ]

    def __str__(self):
        return f"Turnover Analysis - {self.report_period}"


class EmployeeEngagement(models.Model):
    """Track employee engagement scores and trends"""
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='engagement_score')
    
    survey_date = models.DateField()
    
    # Engagement dimensions
    job_satisfaction = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="1-10 scale"
    )
    
    career_development = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Satisfaction with growth opportunities"
    )
    
    management_support = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Support from immediate manager"
    )
    
    team_collaboration = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Collaboration with team members"
    )
    
    work_life_balance = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Work-life balance satisfaction"
    )
    
    company_culture = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Alignment with company culture"
    )
    
    overall_engagement = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Overall engagement score"
    )
    
    engagement_trend = models.CharField(
        max_length=20,
        choices=[('IMPROVING', 'Improving'), ('STABLE', 'Stable'), ('DECLINING', 'Declining')],
        default='STABLE'
    )
    
    comments = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'retention_employee_engagement'
        ordering = ['-survey_date']
        indexes = [
            models.Index(fields=['employee', 'survey_date']),
            models.Index(fields=['overall_engagement']),
        ]

    def __str__(self):
        return f"Engagement Score - {self.employee} ({self.survey_date})"
