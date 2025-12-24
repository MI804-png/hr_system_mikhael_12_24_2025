from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Employee(models.Model):
    EMPLOYMENT_TYPE = [
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('contract', 'Contract'),
        ('temporary', 'Temporary'),
    ]
    
    DEPARTMENT_CHOICES = [
        ('hr', 'Human Resources'),
        ('it', 'IT'),
        ('finance', 'Finance'),
        ('operations', 'Operations'),
        ('sales', 'Sales'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    position = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE)
    base_salary = models.DecimalField(max_digits=10, decimal_places=2)
    hire_date = models.DateField()
    
    # Manager relationship
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    
    # Status tracking
    is_active = models.BooleanField(default=True)
    is_on_leave = models.BooleanField(default=False)
    
    # Documents
    identity_document = models.FileField(upload_to='employee_documents/', null=True, blank=True)
    contract = models.FileField(upload_to='employee_contracts/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee_id']),
            models.Index(fields=['department', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"


class EmployeeBenefits(models.Model):
    BENEFIT_TYPE = [
        ('health_insurance', 'Health Insurance'),
        ('pension', 'Pension'),
        ('bonus', 'Performance Bonus'),
        ('allowance', 'Allowance'),
        ('stock_options', 'Stock Options'),
    ]
    
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='benefits')
    health_insurance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pension_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    annual_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Benefits for {self.employee}"


class Leave(models.Model):
    LEAVE_TYPE = [
        ('annual', 'Annual Leave'),
        ('sick', 'Sick Leave'),
        ('emergency', 'Emergency Leave'),
        ('unpaid', 'Unpaid Leave'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField()
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approval_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.start_date})"
    
    @property
    def total_days(self):
        return (self.end_date - self.start_date).days + 1
