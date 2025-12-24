from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, AttendanceSummaryViewSet

router = DefaultRouter()
router.register(r'', AttendanceViewSet, basename='attendance')
router.register(r'summary', AttendanceSummaryViewSet, basename='attendance_summary')

urlpatterns = [
    path('', include(router.urls)),
]
