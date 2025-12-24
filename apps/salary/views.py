from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime
from .models import Salary, SalaryTransaction, PayrollBatch
from .serializers import SalarySerializer, SalaryTransactionSerializer, PayrollBatchSerializer
from apps.employees.models import Employee

class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Only admins can create salaries
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        """Calculate salary components"""
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        salary = self.get_object()
        salary.calculate_salary()
        return Response(SalarySerializer(salary).data)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process the salary"""
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        salary = self.get_object()
        try:
            salary.process(request.user)
            return Response(SalarySerializer(salary).data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Mark salary as paid"""
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        salary = self.get_object()
        try:
            salary.mark_as_paid()
            return Response(SalarySerializer(salary).data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """Get salary records for a specific employee"""
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return Response({'detail': 'Employee ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        salaries = Salary.objects.filter(employee_id=employee_id).order_by('-year', '-month')
        serializer = SalarySerializer(salaries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get salaries by status"""
        status_filter = request.query_params.get('status')
        if not status_filter:
            return Response({'detail': 'Status parameter required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        salaries = Salary.objects.filter(status=status_filter)
        serializer = SalarySerializer(salaries, many=True)
        return Response(serializer.data)


class PayrollBatchViewSet(viewsets.ModelViewSet):
    queryset = PayrollBatch.objects.all()
    serializer_class = PayrollBatchSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Only admins can create payroll batches
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        month = request.data.get('month')
        year = request.data.get('year')
        
        # Create salary records for all active employees
        employees = Employee.objects.filter(is_active=True)
        batch = PayrollBatch.objects.create(
            month=month,
            year=year,
            total_employees=employees.count(),
            created_by=request.user
        )
        
        for employee in employees:
            Salary.objects.get_or_create(
                employee=employee,
                month=month,
                year=year,
                defaults={'base_salary': employee.base_salary, 'working_days': 22}
            )
        
        return Response(
            PayrollBatchSerializer(batch).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process all salaries in the batch"""
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        batch = self.get_object()
        salaries = Salary.objects.filter(month=batch.month, year=batch.year)
        
        batch.status = 'processing'
        batch.save()
        
        total_amount = 0
        for salary in salaries:
            salary.calculate_salary()
            salary.process(request.user)
            total_amount += salary.net_salary
            batch.processed_count += 1
        
        batch.total_amount = total_amount
        batch.status = 'completed'
        batch.processed_by = request.user
        batch.processed_date = timezone.now()
        batch.save()
        
        return Response(PayrollBatchSerializer(batch).data)
