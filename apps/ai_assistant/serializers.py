from rest_framework import serializers
from .models import AIAssistantConversation, ConversationMessage

class ConversationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationMessage
        fields = ['id', 'role', 'content', 'query_type', 'created_at']

class AIAssistantConversationSerializer(serializers.ModelSerializer):
    messages = ConversationMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = AIAssistantConversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages']
