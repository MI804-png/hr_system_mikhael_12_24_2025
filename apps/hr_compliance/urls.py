from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegulationCategoryViewSet, RegulationViewSet, HRPolicyViewSet,
    PolicyAcknowledgmentViewSet, ComplianceTrainingViewSet,
    TrainingCompletionViewSet, ComplianceAuditViewSet,
    ComplianceIncidentViewSet, ComplianceDashboardViewSet
)

router = DefaultRouter()
router.register(r'regulation-categories', RegulationCategoryViewSet)
router.register(r'regulations', RegulationViewSet)
router.register(r'policies', HRPolicyViewSet)
router.register(r'policy-acknowledgments', PolicyAcknowledgmentViewSet)
router.register(r'trainings', ComplianceTrainingViewSet)
router.register(r'training-completions', TrainingCompletionViewSet)
router.register(r'audits', ComplianceAuditViewSet)
router.register(r'incidents', ComplianceIncidentViewSet)
router.register(r'dashboards', ComplianceDashboardViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
