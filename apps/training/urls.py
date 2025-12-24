from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.training.views import (
    TrainingProgramViewSet, TrainingEnrollmentViewSet, CertificationViewSet,
    EmployeeCertificationViewSet, SkillViewSet, EmployeeSkillViewSet,
    LearningPathViewSet, EmployeeLearningPathViewSet
)

router = DefaultRouter()
router.register(r'programs', TrainingProgramViewSet, basename='training_program')
router.register(r'enrollments', TrainingEnrollmentViewSet, basename='training_enrollment')
router.register(r'certifications', CertificationViewSet, basename='certification')
router.register(r'employee-certifications', EmployeeCertificationViewSet, basename='employee_certification')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'employee-skills', EmployeeSkillViewSet, basename='employee_skill')
router.register(r'learning-paths', LearningPathViewSet, basename='learning_path')
router.register(r'employee-learning-paths', EmployeeLearningPathViewSet, basename='employee_learning_path')

urlpatterns = [
    path('', include(router.urls)),
]
