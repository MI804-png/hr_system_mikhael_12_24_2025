from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.training.models import (
    TrainingProgram, TrainingEnrollment, Certification, EmployeeCertification,
    Skill, EmployeeSkill, LearningPath, EmployeeLearningPath
)
from apps.training.serializers import (
    TrainingProgramSerializer, TrainingEnrollmentSerializer, CertificationSerializer,
    EmployeeCertificationSerializer, SkillSerializer, EmployeeSkillSerializer,
    LearningPathSerializer, EmployeeLearningPathSerializer
)

class TrainingProgramViewSet(viewsets.ModelViewSet):
    queryset = TrainingProgram.objects.all()
    serializer_class = TrainingProgramSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'status', 'is_mandatory']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date']

class TrainingEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = TrainingEnrollment.objects.all()
    serializer_class = TrainingEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'training_program', 'status']
    ordering_fields = ['enrollment_date']
    
    @action(detail=True, methods=['post'])
    def submit_assessment(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.assessment_score = request.data.get('score')
        enrollment.assessment_result = request.data.get('result')
        enrollment.feedback = request.data.get('feedback', '')
        if enrollment.assessment_result == 'pass':
            from django.utils import timezone
            enrollment.completion_date = timezone.now().date()
            enrollment.status = 'completed'
        enrollment.save()
        return Response(TrainingEnrollmentSerializer(enrollment).data)

class CertificationViewSet(viewsets.ModelViewSet):
    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_mandatory', 'is_active']
    search_fields = ['name', 'issuing_organization']

class EmployeeCertificationViewSet(viewsets.ModelViewSet):
    queryset = EmployeeCertification.objects.all()
    serializer_class = EmployeeCertificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'certification']
    ordering_fields = ['obtained_date', 'expiry_date']

class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name']

class EmployeeSkillViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSkill.objects.all()
    serializer_class = EmployeeSkillSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'skill', 'proficiency_level', 'verified']
    
    @action(detail=True, methods=['post'])
    def verify_skill(self, request, pk=None):
        skill = self.get_object()
        from django.utils import timezone
        skill.verified = True
        skill.verified_by = request.user
        skill.verified_date = timezone.now().date()
        skill.save()
        return Response(EmployeeSkillSerializer(skill).data)

class LearningPathViewSet(viewsets.ModelViewSet):
    queryset = LearningPath.objects.all()
    serializer_class = LearningPathSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'target_role']

class EmployeeLearningPathViewSet(viewsets.ModelViewSet):
    queryset = EmployeeLearningPath.objects.all()
    serializer_class = EmployeeLearningPathSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'learning_path', 'status']
    ordering_fields = ['enrollment_date', 'expected_completion_date']
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        path = self.get_object()
        path.progress_percentage = request.data.get('progress_percentage', path.progress_percentage)
        path.status = request.data.get('status', path.status)
        if path.status == 'completed':
            from django.utils import timezone
            path.actual_completion_date = timezone.now().date()
        path.save()
        return Response(EmployeeLearningPathSerializer(path).data)
