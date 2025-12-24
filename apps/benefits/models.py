from django.db import models
from apps.employees.models import Employee
from django.contrib.auth.models import User

class BenefitType(models.Model):
    TYPE_CHOICES = [
        ('insurance', 'Insurance'),
        ('retirement', 'Retirement'),
        ('wellness', 'Wellness'),
        ('financial', 'Financial'),
        ('time_off', 'Time Off'),
        ('education', 'Education'),
    ]
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    description = models.TextField()
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['type', 'name']
    
    def __str__(self):
        return self.name


class BenefitPackage(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    benefits = models.ManyToManyField(BenefitType, related_name='packages')
    
    monthly_cost = models.DecimalField(max_digits=10, decimal_places=2)
    annual_limit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class HealthInsurance(models.Model):
    PLAN_CHOICES = [
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]
    
    plan_name = models.CharField(max_length=255)
    plan_type = models.CharField(max_length=50, choices=PLAN_CHOICES)
    provider = models.CharField(max_length=255)
    
    description = models.TextField()
    coverage_details = models.TextField()
    
    employee_premium = models.DecimalField(max_digits=10, decimal_places=2)
    employer_contribution = models.DecimalField(max_digits=10, decimal_places=2)
    
    deductible = models.DecimalField(max_digits=10, decimal_places=2)
    out_of_pocket_max = models.DecimalField(max_digits=10, decimal_places=2)
    
    effective_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['plan_name']
    
    def __str__(self):
        return f"{self.plan_name} - {self.provider}"


class RetirementPlan(models.Model):
    PLAN_CHOICES = [
        ('401k', '401(k)'),
        ('roth_ira', 'Roth IRA'),
        ('pension', 'Pension'),
        ('403b', '403(b)'),
    ]
    
    plan_name = models.CharField(max_length=255)
    plan_type = models.CharField(max_length=50, choices=PLAN_CHOICES)
    provider = models.CharField(max_length=255)
    
    description = models.TextField()
    
    employee_contribution_max = models.DecimalField(max_digits=10, decimal_places=2)
    employer_match_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    employer_match_max = models.DecimalField(max_digits=10, decimal_places=2)
    
    vesting_schedule = models.TextField()  # Description of vesting terms
    
    effective_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['plan_name']
    
    def __str__(self):
        return self.plan_name


class EmployeeBenefitEnrollment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('enrolled', 'Enrolled'),
        ('waived', 'Waived'),
        ('cancelled', 'Cancelled'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='benefit_enrollments')
    benefit_package = models.ForeignKey(BenefitPackage, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    enrollment_date = models.DateField()
    effective_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    monthly_deduction = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'benefit_package', 'effective_date')
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.employee} - {self.benefit_package}"


class HealthInsuranceEnrollment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('terminated', 'Terminated'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='health_insurance_enrollments')
    insurance_plan = models.ForeignKey(HealthInsurance, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    enrollment_date = models.DateField()
    effective_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    
    dependents = models.IntegerField(default=0)
    coverage_type = models.CharField(max_length=50, choices=[
        ('employee', 'Employee Only'),
        ('employee_spouse', 'Employee + Spouse'),
        ('employee_children', 'Employee + Children'),
        ('family', 'Family'),
    ])
    
    monthly_premium = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.employee} - {self.insurance_plan}"


class RetirementPlanEnrollment(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='retirement_plan_enrollments')
    retirement_plan = models.ForeignKey(RetirementPlan, on_delete=models.CASCADE)
    
    enrollment_date = models.DateField()
    effective_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    
    employee_contribution_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    employer_match_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    account_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    last_contribution_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'retirement_plan')
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.employee} - {self.retirement_plan}"


class Reimbursement(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]
    
    CATEGORY_CHOICES = [
        ('travel', 'Travel'),
        ('meals', 'Meals'),
        ('office_supplies', 'Office Supplies'),
        ('training', 'Training'),
        ('medical', 'Medical'),
        ('wellness', 'Wellness'),
        ('other', 'Other'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='reimbursements')
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    expense_date = models.DateField()
    submission_date = models.DateField(auto_now_add=True)
    
    receipt = models.FileField(upload_to='receipts/')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_reimbursements')
    approval_date = models.DateField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    paid_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-submission_date']
    
    def __str__(self):
        return f"{self.employee} - {self.category} - ${self.amount}"


class WellnessProgram(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    type = models.CharField(max_length=50, choices=[
        ('gym', 'Gym Membership'),
        ('counseling', 'Mental Health Counseling'),
        ('wellness_check', 'Wellness Check-ups'),
        ('fitness_class', 'Fitness Classes'),
        ('meditation', 'Meditation/Yoga'),
        ('nutrition', 'Nutrition Program'),
        ('other', 'Other'),
    ])
    
    provider = models.CharField(max_length=255, blank=True)
    cost_per_employee = models.DecimalField(max_digits=10, decimal_places=2)
    
    max_annual_benefit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class WellnessProgramParticipation(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='wellness_participations')
    wellness_program = models.ForeignKey(WellnessProgram, on_delete=models.CASCADE)
    
    enrollment_date = models.DateField()
    exit_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('employee', 'wellness_program')
        ordering = ['-enrollment_date']
    
    def __str__(self):
        return f"{self.employee} - {self.wellness_program}"
