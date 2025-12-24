from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Employee, EmployeeBenefits, Leave
from .serializers import EmployeeSerializer, EmployeeBenefitsSerializer, LeaveSerializer
from django.contrib.auth.models import User

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Only admins and managers can create employees
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Only admins and managers can update employees
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_department(self, request):
        department = request.query_params.get('department')
        if not department:
            return Response({'detail': 'Department parameter required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        employees = Employee.objects.filter(department=department, is_active=True)
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_manager(self, request):
        manager_id = request.query_params.get('manager_id')
        if not manager_id:
            return Response({'detail': 'Manager ID parameter required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        employees = Employee.objects.filter(manager_id=manager_id, is_active=True)
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_leave_status(self, request, pk=None):
        # Only managers and admins can toggle leave status
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        employee = self.get_object()
        employee.is_on_leave = not employee.is_on_leave
        employee.save()
        return Response(EmployeeSerializer(employee).data)


class EmployeeBenefitsViewSet(viewsets.ModelViewSet):
    queryset = EmployeeBenefits.objects.all()
    serializer_class = EmployeeBenefitsSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Employees can only request their own leave
        if request.user.is_employee():
            employee = Employee.objects.get(user=request.user)
            request.data['employee'] = employee.id
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        # Only admins and managers can approve leave
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        leave = self.get_object()
        leave.status = 'approved'
        leave.approved_by = request.user
        leave.approval_date = timezone.now()
        leave.save()
        return Response(LeaveSerializer(leave).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        # Only admins and managers can reject leave
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        leave = self.get_object()
        leave.status = 'rejected'
        leave.approved_by = request.user
        leave.approval_date = timezone.now()
        leave.save()
        return Response(LeaveSerializer(leave).data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        leaves = Leave.objects.filter(status='pending')
        serializer = LeaveSerializer(leaves, many=True)
        return Response(serializer.data)
