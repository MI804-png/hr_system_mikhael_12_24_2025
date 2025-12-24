from django.db import models
from apps.employees.models import Employee
from django.contrib.auth.models import User

class Grievance(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('acknowledged', 'Acknowledged'),
        ('under_investigation', 'Under Investigation'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('escalated', 'Escalated'),
    ]
    
    CATEGORY_CHOICES = [
        ('harassment', 'Harassment'),
        ('discrimination', 'Discrimination'),
        ('unfair_treatment', 'Unfair Treatment'),
        ('safety', 'Safety Concern'),
        ('management_conflict', 'Management Conflict'),
        ('wage_issue', 'Wage/Compensation Issue'),
        ('other', 'Other'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='grievances')
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    involved_parties = models.TextField(help_text="Names/descriptions of parties involved")
    incident_date = models.DateField()
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='submitted')
    
    filed_date = models.DateTimeField(auto_now_add=True)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_grievances')
    
    resolution = models.TextField(blank=True)
    resolution_date = models.DateField(null=True, blank=True)
    
    documents = models.FileField(upload_to='grievances/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-filed_date']
    
    def __str__(self):
        return f"{self.title} - {self.employee}"


class GrievanceFollowUp(models.Model):
    grievance = models.ForeignKey(Grievance, on_delete=models.CASCADE, related_name='follow_ups')
    
    notes = models.TextField()
    follow_up_date = models.DateField()
    
    action_taken = models.TextField(blank=True)
    next_steps = models.TextField(blank=True)
    
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-follow_up_date']
    
    def __str__(self):
        return f"Follow-up - {self.grievance}"


class ConflictMediation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('unresolved', 'Unresolved'),
    ]
    
    grievance = models.OneToOneField(Grievance, on_delete=models.CASCADE, related_name='mediation')
    
    parties_involved = models.ManyToManyField(Employee, related_name='mediations_involved')
    
    mediator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='mediations_conducted')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    
    scheduled_date = models.DateField(null=True, blank=True)
    mediation_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    
    notes_from_session = models.TextField(blank=True)
    agreement_summary = models.TextField(blank=True)
    
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Mediation - {self.grievance}"


class EmployeeEngagement(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='engagement_records')
    
    # Engagement metrics
    job_satisfaction = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    work_life_balance = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    team_collaboration = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    management_trust = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    career_growth_opportunity = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    
    survey_date = models.DateField()
    
    overall_engagement_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-survey_date']
    
    def __str__(self):
        return f"Engagement - {self.employee} - {self.survey_date}"


class ExitInterview(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='exit_interview')
    
    interview_date = models.DateField()
    last_working_day = models.DateField()
    
    position_held = models.CharField(max_length=255)
    tenure_years = models.DecimalField(max_digits=5, decimal_places=2)
    
    reason_for_leaving = models.CharField(max_length=255, choices=[
        ('better_opportunity', 'Better Opportunity'),
        ('salary', 'Salary'),
        ('management', 'Management Issues'),
        ('location', 'Relocation'),
        ('health', 'Health Issues'),
        ('personal', 'Personal Reasons'),
        ('retirement', 'Retirement'),
        ('other', 'Other'),
    ])
    
    detailed_reason = models.TextField()
    
    would_recommend = models.BooleanField(null=True, blank=True)
    recommendation_reason = models.TextField(blank=True)
    
    suggestions_for_improvement = models.TextField(blank=True)
    
    conducted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-interview_date']
    
    def __str__(self):
        return f"Exit Interview - {self.employee}"


class WorkplaceEnvironment(models.Model):
    department = models.CharField(max_length=100)
    
    # Environment metrics
    cleanliness = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    safety = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    equipment_condition = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    noise_level = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])  # 1=quiet, 5=very noisy
    temperature_control = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    
    assessment_date = models.DateField()
    assessed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    improvement_actions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-assessment_date']
    
    def __str__(self):
        return f"Environment - {self.department} - {self.assessment_date}"
