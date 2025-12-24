from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkforceCostAnalysisViewSet, TurnoverAnalysisViewSet, HumanCapitalROIViewSet,
    StrategicFinancialPlanViewSet, FinancialGoalViewSet
)

router = DefaultRouter()
router.register(r'cost-analysis', WorkforceCostAnalysisViewSet, basename='workforce-cost-analysis')
router.register(r'turnover-analysis', TurnoverAnalysisViewSet, basename='turnover-analysis')
router.register(r'roi-calculations', HumanCapitalROIViewSet, basename='human-capital-roi')
router.register(r'strategic-plans', StrategicFinancialPlanViewSet, basename='strategic-financial-plan')
router.register(r'financial-goals', FinancialGoalViewSet, basename='financial-goal')

urlpatterns = [
    path('', include(router.urls)),
]
