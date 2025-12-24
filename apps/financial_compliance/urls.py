from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FinancialAuditLogViewSet, ComplianceRecordViewSet, TaxFilingRecordViewSet,
    FinancialRiskAssessmentViewSet, TerminationFinancialsViewSet
)

router = DefaultRouter()
router.register(r'audit-logs', FinancialAuditLogViewSet, basename='financial-audit-log')
router.register(r'compliance-records', ComplianceRecordViewSet, basename='compliance-record')
router.register(r'tax-filings', TaxFilingRecordViewSet, basename='tax-filing-record')
router.register(r'risk-assessments', FinancialRiskAssessmentViewSet, basename='financial-risk-assessment')
router.register(r'termination-financials', TerminationFinancialsViewSet, basename='termination-financials')

urlpatterns = [
    path('', include(router.urls)),
]
