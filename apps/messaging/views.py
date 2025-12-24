from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Message, Notification, EmailLog
from .serializers import MessageSerializer, NotificationSerializer, EmailLogSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(recipients=user) | Message.objects.filter(sender=user)
    
    def create(self, request, *args, **kwargs):
        # Check permissions for sending messages
        if request.user.role in ['employee', 'visitor']:
            return Response(
                {'detail': 'Permission denied. Only administrators and managers can send messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def inbox(self, request):
        """Get user's inbox messages"""
        messages = Message.objects.filter(recipients=request.user).order_by('-created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def sent(self, request):
        """Get user's sent messages"""
        messages = Message.objects.filter(sender=request.user).order_by('-created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark message as read"""
        message = self.get_object()
        if request.user in message.recipients.all():
            message.is_read = True
            message.save()
            return Response(MessageSerializer(message).data)
        return Response(
            {'detail': 'Permission denied.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send message as email"""
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message = self.get_object()
        try:
            message.send_email()
            return Response({'detail': 'Email sent successfully.'})
        except Exception as e:
            return Response(
                {'detail': f'Error sending email: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def send_announcement(self, request):
        """Send announcement to all users"""
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        subject = request.data.get('subject')
        content = request.data.get('content')
        
        if not subject or not content:
            return Response(
                {'detail': 'Subject and content are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        all_users = User.objects.filter(is_active_user=True)
        message = Message.objects.create(
            sender=request.user,
            subject=subject,
            content=content,
            message_type='announcement'
        )
        message.recipients.set(all_users)
        message.send_email()
        
        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        if notification.user == request.user:
            notification.is_read = True
            notification.save()
            return Response(NotificationSerializer(notification).data)
        return Response(
            {'detail': 'Permission denied.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.all()
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_admin():
            return EmailLog.objects.none()
        return EmailLog.objects.all().order_by('-created_at')
