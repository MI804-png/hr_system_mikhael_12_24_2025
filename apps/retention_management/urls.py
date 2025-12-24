from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'retention-risks', views.RetentionRiskViewSet, basename='retention-risk')
router.register(r'interventions', views.RetentionInterventionViewSet, basename='intervention')
router.register(r'succession-plans', views.SuccessionPlanViewSet, basename='succession-plan')
router.register(r'succession-candidates', views.SuccessionCandidateViewSet, basename='succession-candidate')
router.register(r'exit-interviews', views.ExitInterviewViewSet, basename='exit-interview')
router.register(r'turnover-analysis', views.TurnoverAnalysisViewSet, basename='turnover-analysis')
router.register(r'engagement-scores', views.EmployeeEngagementViewSet, basename='engagement-score')

urlpatterns = [
    path('', include(router.urls)),
]
