from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Department, JobPosition
from .serializers import DepartmentSerializer, JobPositionSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'code']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class JobPositionViewSet(viewsets.ModelViewSet):
    queryset = JobPosition.objects.all()
    serializer_class = JobPositionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'department', 'salary_range_min']
