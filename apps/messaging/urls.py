from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, NotificationViewSet, EmailLogViewSet

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'email-logs', EmailLogViewSet, basename='email_log')

urlpatterns = [
    path('', include(router.urls)),
]
