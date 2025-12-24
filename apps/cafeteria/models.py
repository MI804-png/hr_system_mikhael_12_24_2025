from django.db import models
from django.utils import timezone
from apps.employees.models import Employee
from django.contrib.auth.models import User

class CafeteriaMenu(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    available_date = models.DateField()
    category = models.CharField(max_length=100, choices=[
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ])
    is_available = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-available_date']
        indexes = [
            models.Index(fields=['available_date', 'category']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.available_date}"


class CafeteriaOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('ready', 'Ready'),
        ('collected', 'Collected'),
        ('cancelled', 'Cancelled'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='cafeteria_orders')
    menu_item = models.ForeignKey(CafeteriaMenu, on_delete=models.CASCADE, related_name='orders')
    quantity = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    order_date = models.DateTimeField(auto_now_add=True)
    collection_date = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['employee', 'order_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.employee} - {self.menu_item} ({self.order_date})"
    
    def save(self, *args, **kwargs):
        self.total_price = self.menu_item.price * self.quantity
        super().save(*args, **kwargs)


class CafeteriaBalance(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='cafeteria_balance')
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.IntegerField(default=0)
    monthly_limit = models.DecimalField(max_digits=10, decimal_places=2, default=500)  # Monthly spending limit
    
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cafeteria Balance - {self.employee}"
    
    @property
    def remaining_limit(self):
        return self.monthly_limit - self.total_spent


class CafeteriaTransaction(models.Model):
    TRANSACTION_TYPE = [
        ('order', 'Order'),
        ('refund', 'Refund'),
        ('adjustment', 'Adjustment'),
    ]
    
    balance = models.ForeignKey(CafeteriaBalance, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    order = models.ForeignKey(CafeteriaOrder, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.balance} - {self.transaction_type} {self.amount}"
