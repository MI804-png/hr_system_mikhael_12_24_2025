from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalaryBandViewSet, CompensationStructureViewSet, EmployeeCompensationPlanViewSet,
    IncentivePlanViewSet, IncentivePlanEnrollmentViewSet, MarketAnalysisViewSet
)

router = DefaultRouter()
router.register(r'salary-bands', SalaryBandViewSet, basename='salary-band')
router.register(r'compensation-structures', CompensationStructureViewSet, basename='compensation-structure')
router.register(r'employee-plans', EmployeeCompensationPlanViewSet, basename='employee-compensation-plan')
router.register(r'incentive-plans', IncentivePlanViewSet, basename='incentive-plan')
router.register(r'incentive-enrollments', IncentivePlanEnrollmentViewSet, basename='incentive-plan-enrollment')
router.register(r'market-analysis', MarketAnalysisViewSet, basename='market-analysis')

urlpatterns = [
    path('', include(router.urls)),
]
