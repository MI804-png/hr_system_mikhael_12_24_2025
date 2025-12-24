from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'esg-objectives', views.ESGObjectiveViewSet, basename='esg-objective')
router.register(r'volunteer-programs', views.VolunteerProgramViewSet, basename='volunteer-program')
router.register(r'volunteer-logs', views.EmployeeVolunteerLogViewSet, basename='volunteer-log')
router.register(r'sustainability-initiatives', views.SustainabilityInitiativeViewSet, basename='sustainability-initiative')
router.register(r'diversity-metrics', views.DiversityMetricViewSet, basename='diversity-metric')
router.register(r'community-outreach', views.CommunityOutreachViewSet, basename='community-outreach')
router.register(r'csr-reports', views.CSRReportViewSet, basename='csr-report')

urlpatterns = [
    path('', include(router.urls)),
]
