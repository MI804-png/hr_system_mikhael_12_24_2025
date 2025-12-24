from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from apps.employees.models import Employee

class JobPosting(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('on_hold', 'On Hold'),
    ]
    
    title = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    description = models.TextField()
    requirements = models.TextField()
    salary_range_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_range_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    position_type = models.CharField(max_length=50, choices=[
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ])
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    posted_date = models.DateTimeField(auto_now_add=True)
    closing_date = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_postings')
    
    class Meta:
        ordering = ['-posted_date']
    
    def __str__(self):
        return f"{self.title} - {self.department}"


class Candidate(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('screening', 'Screening'),
        ('interview_1', 'First Interview'),
        ('interview_2', 'Second Interview'),
        ('interview_3', 'Final Interview'),
        ('offered', 'Offered'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='candidates')
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    resume = models.FileField(upload_to='resumes/')
    cover_letter = models.TextField(blank=True)
    
    source = models.CharField(max_length=100, choices=[
        ('job_board', 'Job Board'),
        ('linkedin', 'LinkedIn'),
        ('referral', 'Employee Referral'),
        ('direct', 'Direct Application'),
        ('recruitment_agency', 'Recruitment Agency'),
        ('other', 'Other'),
    ])
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    rating = models.IntegerField(default=0, choices=[(i, str(i)) for i in range(6)])  # 0-5 stars
    
    applied_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_candidates')
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-applied_date']
        indexes = [
            models.Index(fields=['status', 'job_posting']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.job_posting.title}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Interview(models.Model):
    INTERVIEW_TYPE = [
        ('phone', 'Phone Screening'),
        ('technical', 'Technical Interview'),
        ('behavioral', 'Behavioral Interview'),
        ('final', 'Final Round'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='interviews')
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    scheduled_date = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    
    interviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='interviews_conducted')
    location = models.CharField(max_length=255, blank=True)  # Address or "Virtual"
    
    feedback = models.TextField(blank=True)
    rating = models.IntegerField(default=0, choices=[(i, str(i)) for i in range(6)])  # 0-5 stars
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-scheduled_date']
    
    def __str__(self):
        return f"{self.candidate.full_name} - {self.get_interview_type_display()}"


class OfferLetter(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='offer')
    
    position_title = models.CharField(max_length=255)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    
    benefits_summary = models.TextField()
    terms_conditions = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    sent_date = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateField()
    
    accepted_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Offer - {self.candidate.full_name}"


class Onboarding(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='onboarding')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Onboarding tasks
    equipment_assigned = models.BooleanField(default=False)
    it_account_created = models.BooleanField(default=False)
    email_setup = models.BooleanField(default=False)
    access_credentials_issued = models.BooleanField(default=False)
    
    # Training
    orientation_completed = models.BooleanField(default=False)
    policy_acknowledgment = models.BooleanField(default=False)
    nda_signed = models.BooleanField(default=False)
    
    # Documentation
    contract_signed = models.BooleanField(default=False)
    tax_forms_completed = models.BooleanField(default=False)
    emergency_contact_provided = models.BooleanField(default=False)
    
    mentor_assigned = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='mentoring')
    
    start_date = models.DateField()
    expected_completion_date = models.DateField()
    actual_completion_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Onboarding - {self.employee}"
    
    @property
    def completion_percentage(self):
        total_tasks = 9  # Total number of boolean fields
        completed = sum([
            self.equipment_assigned, self.it_account_created, self.email_setup,
            self.access_credentials_issued, self.orientation_completed,
            self.policy_acknowledgment, self.nda_signed, self.contract_signed,
            self.tax_forms_completed, self.emergency_contact_provided
        ])
        return int((completed / total_tasks) * 100)


class OnboardingChecklist(models.Model):
    onboarding = models.ForeignKey(Onboarding, on_delete=models.CASCADE, related_name='checklists')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, choices=[
        ('equipment', 'Equipment'),
        ('it', 'IT Setup'),
        ('training', 'Training'),
        ('documentation', 'Documentation'),
        ('compliance', 'Compliance'),
    ])
    
    is_completed = models.BooleanField(default=False)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    due_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['due_date']
    
    def __str__(self):
        return f"{self.title} - {self.onboarding.employee}"
