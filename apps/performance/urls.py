from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.performance.views import (
    PerformanceReviewTemplateViewSet, PerformanceReviewViewSet, PerformanceGoalViewSet,
    FeedbackRoundViewSet, FeedbackRequestViewSet, DevelopmentPlanViewSet,
    ProductivityMetricViewSet
)

router = DefaultRouter()
router.register(r'review-templates', PerformanceReviewTemplateViewSet, basename='review_template')
router.register(r'reviews', PerformanceReviewViewSet, basename='review')
router.register(r'goals', PerformanceGoalViewSet, basename='goal')
router.register(r'feedback-rounds', FeedbackRoundViewSet, basename='feedback_round')
router.register(r'feedback-requests', FeedbackRequestViewSet, basename='feedback_request')
router.register(r'development-plans', DevelopmentPlanViewSet, basename='development_plan')
router.register(r'productivity-metrics', ProductivityMetricViewSet, basename='productivity_metric')

urlpatterns = [
    path('', include(router.urls)),
]
