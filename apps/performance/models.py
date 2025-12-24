from django.db import models
from apps.employees.models import Employee
from django.contrib.auth.models import User

class PerformanceReviewTemplate(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    # Template structure
    review_period = models.CharField(max_length=50, choices=[
        ('quarterly', 'Quarterly'),
        ('semi_annual', 'Semi-Annual'),
        ('annual', 'Annual'),
    ])
    
    rating_scale = models.IntegerField(default=5, choices=[(i, str(i)) for i in range(3, 6)])
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class PerformanceReview(models.Model):
    RATING_CHOICES = [
        (1, 'Poor'),
        (2, 'Below Average'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('completed', 'Completed'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    template = models.ForeignKey(PerformanceReviewTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews_conducted')
    
    review_period_start = models.DateField()
    review_period_end = models.DateField()
    review_date = models.DateField()
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    
    # Performance ratings
    job_knowledge = models.IntegerField(choices=RATING_CHOICES)
    quality_of_work = models.IntegerField(choices=RATING_CHOICES)
    productivity = models.IntegerField(choices=RATING_CHOICES)
    teamwork = models.IntegerField(choices=RATING_CHOICES)
    communication = models.IntegerField(choices=RATING_CHOICES)
    initiative = models.IntegerField(choices=RATING_CHOICES)
    reliability = models.IntegerField(choices=RATING_CHOICES)
    
    overall_rating = models.IntegerField(choices=RATING_CHOICES)
    
    # Feedback
    strengths = models.TextField()
    areas_for_improvement = models.TextField()
    achievements = models.TextField()
    goals_for_next_period = models.TextField()
    
    # Comments
    reviewer_comments = models.TextField(blank=True)
    employee_comments = models.TextField(blank=True)
    
    # Recommendations
    salary_increase_recommended = models.BooleanField(default=False)
    promotion_recommended = models.BooleanField(default=False)
    additional_training_needed = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-review_date']
        unique_together = ('employee', 'review_period_start', 'review_period_end')
    
    def __str__(self):
        return f"Review - {self.employee} - {self.review_period_end}"
    
    @property
    def average_rating(self):
        ratings = [
            self.job_knowledge, self.quality_of_work, self.productivity,
            self.teamwork, self.communication, self.initiative, self.reliability
        ]
        return sum(ratings) / len(ratings)


class PerformanceGoal(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
        ('abandoned', 'Abandoned'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_goals')
    
    goal_title = models.CharField(max_length=255)
    description = models.TextField()
    
    category = models.CharField(max_length=100, choices=[
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('strategic', 'Strategic'),
        ('personal_development', 'Personal Development'),
    ])
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='not_started')
    
    start_date = models.DateField()
    due_date = models.DateField()
    
    measurable_outcomes = models.TextField()
    
    progress_percentage = models.IntegerField(default=0)
    
    set_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    completion_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.goal_title} - {self.employee}"


class FeedbackRound(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    is_anonymous = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return self.name


class FeedbackRequest(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('pending', 'Pending'),
    ]
    
    feedback_round = models.ForeignKey(FeedbackRound, on_delete=models.CASCADE, related_name='feedback_requests')
    
    recipient = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='feedback_received')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedback_provided')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='sent')
    
    # 360 feedback categories
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    suggestions = models.TextField(blank=True)
    
    rating = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    
    submitted_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('feedback_round', 'recipient', 'provider')
    
    def __str__(self):
        return f"Feedback - {self.recipient} from {self.provider}"


class DevelopmentPlan(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='development_plan')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Development focus areas
    skill_gaps = models.TextField()
    training_needs = models.TextField()
    
    development_actions = models.TextField()
    
    success_measures = models.TextField()
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='development_plans_created')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"Development Plan - {self.employee}"


class ProductivityMetric(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='productivity_metrics')
    
    metric_date = models.DateField()
    
    # Productivity metrics
    tasks_completed = models.IntegerField(default=0)
    on_time_delivery_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    quality_score = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Attendance
    days_present = models.IntegerField()
    days_absent = models.IntegerField()
    punctuality_score = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Customer/stakeholder feedback
    customer_satisfaction = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-metric_date']
        unique_together = ('employee', 'metric_date')
    
    def __str__(self):
        return f"Metrics - {self.employee} - {self.metric_date}"
