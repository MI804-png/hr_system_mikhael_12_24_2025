import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message

class MessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'message':
            await self.handle_message(data)
    
    async def handle_message(self, data):
        message = data.get('message')
        recipients = data.get('recipients', [])
        
        # Save to database
        await self.save_message(message, recipients)
        
        # Send to recipients
        for recipient_id in recipients:
            recipient_group = f"user_{recipient_id}"
            await self.channel_layer.group_send(
                recipient_group,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender': self.user.id
                }
            )
    
    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message,
            'sender': sender
        }))
    
    @database_sync_to_async
    def save_message(self, content, recipient_ids):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        message = Message.objects.create(
            sender=self.user,
            subject='Real-time Message',
            content=content,
            message_type='internal'
        )
        recipients = User.objects.filter(id__in=recipient_ids)
        message.recipients.set(recipients)
        return message.id
