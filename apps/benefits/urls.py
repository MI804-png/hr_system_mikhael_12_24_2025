from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BenefitTypeViewSet, BenefitPackageViewSet, HealthInsuranceViewSet,
    RetirementPlanViewSet, EmployeeBenefitEnrollmentViewSet,
    HealthInsuranceEnrollmentViewSet, RetirementPlanEnrollmentViewSet,
    ReimbursementViewSet, WellnessProgramViewSet, WellnessProgramParticipationViewSet
)

router = DefaultRouter()
router.register(r'benefit-types', BenefitTypeViewSet, basename='benefit_type')
router.register(r'benefit-packages', BenefitPackageViewSet, basename='benefit_package')
router.register(r'health-insurance-plans', HealthInsuranceViewSet, basename='health_insurance')
router.register(r'retirement-plans', RetirementPlanViewSet, basename='retirement_plan')
router.register(r'benefit-enrollments', EmployeeBenefitEnrollmentViewSet, basename='benefit_enrollment')
router.register(r'health-insurance-enrollments', HealthInsuranceEnrollmentViewSet, basename='health_enrollment')
router.register(r'retirement-enrollments', RetirementPlanEnrollmentViewSet, basename='retirement_enrollment')
router.register(r'reimbursements', ReimbursementViewSet, basename='reimbursement')
router.register(r'wellness-programs', WellnessProgramViewSet, basename='wellness_program')
router.register(r'wellness-participations', WellnessProgramParticipationViewSet, basename='wellness_participation')

urlpatterns = [
    path('', include(router.urls)),
]
