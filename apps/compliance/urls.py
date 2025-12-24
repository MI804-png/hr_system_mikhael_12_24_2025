from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyPolicyViewSet, PolicyAcknowledgmentViewSet, DisciplinaryActionViewSet,
    ComplianceRecordViewSet, AuditLogViewSet, LaborLawComplianceViewSet,
    RiskAssessmentViewSet
)

router = DefaultRouter()
router.register(r'policies', CompanyPolicyViewSet, basename='policy')
router.register(r'policy-acknowledgments', PolicyAcknowledgmentViewSet, basename='policy_acknowledgment')
router.register(r'disciplinary-actions', DisciplinaryActionViewSet, basename='disciplinary_action')
router.register(r'compliance-records', ComplianceRecordViewSet, basename='compliance_record')
router.register(r'audit-logs', AuditLogViewSet, basename='audit_log')
router.register(r'labor-law-compliance', LaborLawComplianceViewSet, basename='labor_law_compliance')
router.register(r'risk-assessments', RiskAssessmentViewSet, basename='risk_assessment')

urlpatterns = [
    path('', include(router.urls)),
]
