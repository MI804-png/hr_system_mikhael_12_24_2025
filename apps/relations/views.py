from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.relations.models import (
    Grievance, GrievanceFollowUp, ConflictMediation,
    EmployeeEngagement, ExitInterview, WorkplaceEnvironment
)
from apps.relations.serializers import (
    GrievanceSerializer, GrievanceFollowUpSerializer, ConflictMediationSerializer,
    EmployeeEngagementSerializer, ExitInterviewSerializer, WorkplaceEnvironmentSerializer
)

class GrievanceViewSet(viewsets.ModelViewSet):
    queryset = Grievance.objects.all()
    serializer_class = GrievanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'category', 'employee']
    search_fields = ['title', 'description']
    ordering_fields = ['filed_date']
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        grievance = self.get_object()
        grievance.status = request.data.get('status', grievance.status)
        if grievance.status == 'resolved':
            grievance.resolution = request.data.get('resolution', '')
            from django.utils import timezone
            grievance.resolution_date = timezone.now().date()
        grievance.save()
        return Response(GrievanceSerializer(grievance).data)
    
    @action(detail=True, methods=['post'])
    def add_follow_up(self, request, pk=None):
        grievance = self.get_object()
        follow_up = GrievanceFollowUp.objects.create(
            grievance=grievance,
            notes=request.data.get('notes'),
            follow_up_date=request.data.get('follow_up_date'),
            action_taken=request.data.get('action_taken', ''),
            next_steps=request.data.get('next_steps', ''),
            added_by=request.user
        )
        return Response(GrievanceFollowUpSerializer(follow_up).data)

class ConflictMediationViewSet(viewsets.ModelViewSet):
    queryset = ConflictMediation.objects.all()
    serializer_class = ConflictMediationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['mediation_date']
    
    @action(detail=True, methods=['post'])
    def complete_mediation(self, request, pk=None):
        mediation = self.get_object()
        mediation.status = 'resolved'
        mediation.notes_from_session = request.data.get('notes')
        mediation.agreement_summary = request.data.get('agreement')
        mediation.save()
        return Response(ConflictMediationSerializer(mediation).data)

class EmployeeEngagementViewSet(viewsets.ModelViewSet):
    queryset = EmployeeEngagement.objects.all()
    serializer_class = EmployeeEngagementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee']
    ordering_fields = ['survey_date']

class ExitInterviewViewSet(viewsets.ModelViewSet):
    queryset = ExitInterview.objects.all()
    serializer_class = ExitInterviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['reason_for_leaving']
    ordering_fields = ['interview_date']

class WorkplaceEnvironmentViewSet(viewsets.ModelViewSet):
    queryset = WorkplaceEnvironment.objects.all()
    serializer_class = WorkplaceEnvironmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['department']
    search_fields = ['department']
    ordering_fields = ['assessment_date']
