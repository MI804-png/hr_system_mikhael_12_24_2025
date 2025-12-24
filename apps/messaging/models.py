from django.db import models
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User

class Message(models.Model):
    MESSAGE_TYPE = [
        ('internal', 'Internal Message'),
        ('email', 'Email'),
        ('announcement', 'Announcement'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipients = models.ManyToManyField(User, related_name='received_messages')
    
    subject = models.CharField(max_length=255)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE, default='internal')
    
    is_read = models.BooleanField(default=False)
    priority = models.IntegerField(default=0, choices=[(0, 'Normal'), (1, 'High'), (2, 'Urgent')])
    
    attachment = models.FileField(upload_to='messages/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['message_type']),
        ]
    
    def __str__(self):
        return f"{self.subject} - from {self.sender}"
    
    def send_email(self):
        """Send message as email"""
        if self.message_type in ['email', 'announcement']:
            recipient_emails = list(self.recipients.values_list('email', flat=True))
            send_mail(
                subject=self.subject,
                message=self.content,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=recipient_emails,
                fail_silently=False,
            )


class MessageRead(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'user')


class Notification(models.Model):
    NOTIFICATION_TYPE = [
        ('message', 'New Message'),
        ('approval', 'Approval Required'),
        ('attendance', 'Attendance Alert'),
        ('salary', 'Salary Processed'),
        ('leave', 'Leave Request'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.notification_type} - {self.title}"


class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]
    
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='email_logs')
    recipient = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.message} - {self.recipient}"
