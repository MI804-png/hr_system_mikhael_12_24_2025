from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'stock-plans', views.StockOptionPlanViewSet, basename='stock-plan')
router.register(r'grants', views.EquityGrantViewSet, basename='equity-grant')
router.register(r'vesting-schedules', views.VestingScheduleViewSet, basename='vesting-schedule')
router.register(r'exercises', views.EquityExerciseViewSet, basename='equity-exercise')
router.register(r'esops', views.ESOPViewSet, basename='esop')
router.register(r'esop-participants', views.ESOPParticipantViewSet, basename='esop-participant')
router.register(r'reports', views.EquityReportViewSet, basename='equity-report')

urlpatterns = [
    path('', include(router.urls)),
]
