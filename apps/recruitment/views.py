from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import JobPosting, Candidate, Interview, OfferLetter, Onboarding, OnboardingChecklist
from .serializers import (
    JobPostingSerializer, CandidateSerializer, InterviewSerializer,
    OfferLetterSerializer, OnboardingSerializer, OnboardingChecklistSerializer
)

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'status', 'position_type']
    search_fields = ['title', 'description']
    ordering_fields = ['posted_date', 'closing_date']
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        request.data._mutable = True
        request.data['created_by'] = request.user.id
        return super().create(request, *args, **kwargs)

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'job_posting', 'source', 'rating']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['applied_date', 'rating']
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        candidate = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            candidate.status = new_status
            candidate.save()
        return Response(CandidateSerializer(candidate).data)
    
    @action(detail=True, methods=['post'])
    def rate_candidate(self, request, pk=None):
        candidate = self.get_object()
        rating = request.data.get('rating', 0)
        candidate.rating = rating
        candidate.save()
        return Response(CandidateSerializer(candidate).data)

class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'interview_type', 'candidate']
    ordering_fields = ['scheduled_date']
    
    @action(detail=True, methods=['post'])
    def complete_interview(self, request, pk=None):
        interview = self.get_object()
        interview.status = 'completed'
        interview.feedback = request.data.get('feedback', '')
        interview.rating = request.data.get('rating', 0)
        interview.save()
        return Response(InterviewSerializer(interview).data)

class OfferLetterViewSet(viewsets.ModelViewSet):
    queryset = OfferLetter.objects.all()
    serializer_class = OfferLetterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'expiry_date']
    
    def create(self, request, *args, **kwargs):
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        request.data._mutable = True
        request.data['created_by'] = request.user.id
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def accept_offer(self, request, pk=None):
        offer = self.get_object()
        from django.utils import timezone
        offer.status = 'accepted'
        offer.accepted_date = timezone.now()
        offer.save()
        return Response(OfferLetterSerializer(offer).data)

class OnboardingViewSet(viewsets.ModelViewSet):
    queryset = Onboarding.objects.all()
    serializer_class = OnboardingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['start_date', 'expected_completion_date']
    
    @action(detail=True, methods=['post'])
    def mark_task_complete(self, request, pk=None):
        onboarding = self.get_object()
        task = request.data.get('task')
        if task and hasattr(onboarding, task):
            setattr(onboarding, task, True)
            onboarding.save()
        return Response(OnboardingSerializer(onboarding).data)
    
    @action(detail=True, methods=['post'])
    def complete_onboarding(self, request, pk=None):
        from django.utils import timezone
        onboarding = self.get_object()
        onboarding.status = 'completed'
        onboarding.actual_completion_date = timezone.now().date()
        onboarding.save()
        return Response(OnboardingSerializer(onboarding).data)
