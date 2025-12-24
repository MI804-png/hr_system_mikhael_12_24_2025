from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from django.contrib.auth.models import User

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
from .models import Message, Notification, EmailLog, MessageRead

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.StringRelatedField(source='sender', read_only=True)
    recipients_data = UserSerializer(source='recipients', many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'recipients', 'recipients_data',
            'subject', 'content', 'message_type', 'is_read', 'priority',
            'attachment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'is_read', 'link', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = [
            'id', 'message', 'recipient', 'status', 'error_message',
            'sent_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
