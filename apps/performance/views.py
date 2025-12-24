from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.performance.models import (
    PerformanceReviewTemplate, PerformanceReview, PerformanceGoal,
    FeedbackRound, FeedbackRequest, DevelopmentPlan, ProductivityMetric
)
from apps.performance.serializers import (
    PerformanceReviewTemplateSerializer, PerformanceReviewSerializer,
    PerformanceGoalSerializer, FeedbackRoundSerializer, FeedbackRequestSerializer,
    DevelopmentPlanSerializer, ProductivityMetricSerializer
)

class PerformanceReviewTemplateViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReviewTemplate.objects.all()
    serializer_class = PerformanceReviewTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']

class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all()
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'status', 'reviewer']
    ordering_fields = ['review_date']
    
    @action(detail=True, methods=['post'])
    def submit_review(self, request, pk=None):
        review = self.get_object()
        review.status = 'submitted'
        review.save()
        return Response(PerformanceReviewSerializer(review).data)
    
    @action(detail=True, methods=['post'])
    def approve_review(self, request, pk=None):
        review = self.get_object()
        review.status = 'completed'
        review.save()
        return Response(PerformanceReviewSerializer(review).data)

class PerformanceGoalViewSet(viewsets.ModelViewSet):
    queryset = PerformanceGoal.objects.all()
    serializer_class = PerformanceGoalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'status', 'priority']
    ordering_fields = ['due_date']
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        goal = self.get_object()
        goal.progress_percentage = request.data.get('progress_percentage', goal.progress_percentage)
        goal.status = request.data.get('status', goal.status)
        goal.save()
        return Response(PerformanceGoalSerializer(goal).data)

class FeedbackRoundViewSet(viewsets.ModelViewSet):
    queryset = FeedbackRound.objects.all()
    serializer_class = FeedbackRoundSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [OrderingFilter]
    ordering_fields = ['start_date']

class FeedbackRequestViewSet(viewsets.ModelViewSet):
    queryset = FeedbackRequest.objects.all()
    serializer_class = FeedbackRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['feedback_round', 'recipient', 'status']
    
    @action(detail=True, methods=['post'])
    def submit_feedback(self, request, pk=None):
        feedback = self.get_object()
        feedback.status = 'submitted'
        feedback.strengths = request.data.get('strengths')
        feedback.areas_for_improvement = request.data.get('areas_for_improvement')
        feedback.suggestions = request.data.get('suggestions')
        feedback.rating = request.data.get('rating')
        from django.utils import timezone
        feedback.submitted_date = timezone.now()
        feedback.save()
        return Response(FeedbackRequestSerializer(feedback).data)

class DevelopmentPlanViewSet(viewsets.ModelViewSet):
    queryset = DevelopmentPlan.objects.all()
    serializer_class = DevelopmentPlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee']

class ProductivityMetricViewSet(viewsets.ModelViewSet):
    queryset = ProductivityMetric.objects.all()
    serializer_class = ProductivityMetricSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee']
    ordering_fields = ['metric_date']
