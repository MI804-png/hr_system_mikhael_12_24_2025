from django.db import models
from django.contrib.auth.models import User

class AIAssistantConversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations')
    
    title = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Conversation - {self.user} - {self.created_at}"


class ConversationMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    
    conversation = models.ForeignKey(AIAssistantConversation, on_delete=models.CASCADE, related_name='messages')
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # Context information
    query_type = models.CharField(max_length=100, blank=True, choices=[
        ('policy', 'Policy Question'),
        ('procedure', 'Procedure Question'),
        ('benefits', 'Benefits Information'),
        ('leave', 'Leave/PTO Question'),
        ('salary', 'Salary/Compensation'),
        ('general', 'General Question'),
        ('other', 'Other'),
    ])
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.role} - {self.created_at}"


class FunctionCall(models.Model):
    """Track function calls made by the AI for auditing and improvement"""
    message = models.ForeignKey(ConversationMessage, on_delete=models.CASCADE, related_name='function_calls')
    
    function_name = models.CharField(max_length=255)
    parameters = models.JSONField(default=dict)
    result = models.JSONField(null=True, blank=True)
    
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.function_name}"
