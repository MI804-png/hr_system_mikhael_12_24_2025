from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobPostingViewSet, CandidateViewSet, InterviewViewSet,
    OfferLetterViewSet, OnboardingViewSet
)

router = DefaultRouter()
router.register(r'job-postings', JobPostingViewSet, basename='job_posting')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'offers', OfferLetterViewSet, basename='offer')
router.register(r'onboarding', OnboardingViewSet, basename='onboarding')

urlpatterns = [
    path('', include(router.urls)),
]
