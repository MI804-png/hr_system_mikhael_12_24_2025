from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.relations.views import (
    GrievanceViewSet, ConflictMediationViewSet, EmployeeEngagementViewSet,
    ExitInterviewViewSet, WorkplaceEnvironmentViewSet
)

router = DefaultRouter()
router.register(r'grievances', GrievanceViewSet, basename='grievance')
router.register(r'mediation', ConflictMediationViewSet, basename='mediation')
router.register(r'engagement', EmployeeEngagementViewSet, basename='engagement')
router.register(r'exit-interviews', ExitInterviewViewSet, basename='exit_interview')
router.register(r'workplace-environment', WorkplaceEnvironmentViewSet, basename='workplace_environment')

urlpatterns = [
    path('', include(router.urls)),
]
