from django.db import models
from apps.employees.models import Employee
from django.contrib.auth.models import User

class TrainingProgram(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    category = models.CharField(max_length=100, choices=[
        ('technical', 'Technical'),
        ('soft_skills', 'Soft Skills'),
        ('compliance', 'Compliance'),
        ('safety', 'Safety'),
        ('leadership', 'Leadership'),
        ('product', 'Product Knowledge'),
        ('other', 'Other'),
    ])
    
    content = models.TextField()
    
    trainer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2)
    
    location = models.CharField(max_length=255, choices=[
        ('in_person', 'In-Person'),
        ('virtual', 'Virtual'),
        ('hybrid', 'Hybrid'),
    ])
    
    max_participants = models.IntegerField(null=True, blank=True)
    
    cost_per_participant = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='planned')
    
    certification_provided = models.BooleanField(default=False)
    
    is_mandatory = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='training_programs_created')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return self.name


class TrainingEnrollment(models.Model):
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='training_enrollments')
    training_program = models.ForeignKey(TrainingProgram, on_delete=models.CASCADE, related_name='enrollments')
    
    enrollment_date = models.DateField(auto_now_add=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='enrolled')
    
    completion_date = models.DateField(null=True, blank=True)
    
    # Assessment
    assessment_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    assessment_result = models.CharField(max_length=50, choices=[
        ('pass', 'Pass'),
        ('fail', 'Fail'),
        ('pending', 'Pending'),
    ], default='pending')
    
    feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'training_program')
        ordering = ['-enrollment_date']
    
    def __str__(self):
        return f"{self.employee} - {self.training_program}"


class Certification(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    issuing_organization = models.CharField(max_length=255)
    
    validity_years = models.IntegerField(null=True, blank=True)
    
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    is_mandatory = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class EmployeeCertification(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='certifications')
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    
    obtained_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    
    certificate_number = models.CharField(max_length=100, blank=True)
    
    document = models.FileField(upload_to='certifications/', null=True, blank=True)
    
    renewal_required_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'certification', 'obtained_date')
        ordering = ['-obtained_date']
    
    def __str__(self):
        return f"{self.employee} - {self.certification}"


class Skill(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    category = models.CharField(max_length=100, choices=[
        ('technical', 'Technical'),
        ('soft', 'Soft Skill'),
        ('industry', 'Industry-Specific'),
        ('language', 'Language'),
    ])
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name


class EmployeeSkill(models.Model):
    PROFICIENCY_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    
    proficiency_level = models.CharField(max_length=20, choices=PROFICIENCY_LEVELS)
    
    years_of_experience = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    last_used_date = models.DateField(null=True, blank=True)
    
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verified_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'skill')
        ordering = ['-proficiency_level', 'skill__name']
    
    def __str__(self):
        return f"{self.employee} - {self.skill} ({self.proficiency_level})"


class LearningPath(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    target_role = models.CharField(max_length=255)
    duration_months = models.IntegerField()
    
    training_programs = models.ManyToManyField(TrainingProgram, related_name='learning_paths')
    required_skills = models.ManyToManyField(Skill, related_name='learning_paths')
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['target_role']
    
    def __str__(self):
        return f"{self.name} - {self.target_role}"


class EmployeeLearningPath(models.Model):
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='learning_paths')
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE)
    
    enrollment_date = models.DateField()
    start_date = models.DateField()
    expected_completion_date = models.DateField()
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='enrolled')
    
    actual_completion_date = models.DateField(null=True, blank=True)
    
    progress_percentage = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'learning_path')
        ordering = ['-enrollment_date']
    
    def __str__(self):
        return f"{self.employee} - {self.learning_path}"
