from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Attendance, AttendanceSummary
from .serializers import AttendanceSerializer, AttendanceSummarySerializer
from apps.employees.models import Employee

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Only admins and managers can create attendance records
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Employee check-in"""
        try:
            employee = Employee.objects.get(user=request.user)
            today = timezone.now().date()
            
            attendance, created = Attendance.objects.get_or_create(
                employee=employee,
                date=today
            )
            
            attendance.check_in_time = timezone.now().time()
            attendance.status = 'present'
            attendance.save()
            
            return Response(
                AttendanceSerializer(attendance).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'Employee profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Employee check-out"""
        try:
            employee = Employee.objects.get(user=request.user)
            today = timezone.now().date()
            
            attendance = Attendance.objects.get(employee=employee, date=today)
            attendance.check_out_time = timezone.now().time()
            attendance.save()
            
            return Response(AttendanceSerializer(attendance).data)
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'Employee profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Attendance.DoesNotExist:
            return Response(
                {'detail': 'No check-in record found for today.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's attendance for all employees"""
        today = timezone.now().date()
        attendance = Attendance.objects.filter(date=today)
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """Get attendance records for a specific employee"""
        employee_id = request.query_params.get('employee_id')
        if not employee_id:
            return Response({'detail': 'Employee ID required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        attendance = Attendance.objects.filter(employee_id=employee_id)
        
        if start_date:
            attendance = attendance.filter(date__gte=start_date)
        if end_date:
            attendance = attendance.filter(date__lte=end_date)
        
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        """Get monthly attendance report for an employee"""
        employee_id = request.query_params.get('employee_id')
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        if not (employee_id and month and year):
            return Response(
                {'detail': 'Employee ID, month, and year are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            summary = AttendanceSummary.objects.get(
                employee_id=employee_id,
                month=int(month),
                year=int(year)
            )
            return Response(AttendanceSummarySerializer(summary).data)
        except AttendanceSummary.DoesNotExist:
            return Response(
                {'detail': 'No summary found for the specified period.'},
                status=status.HTTP_404_NOT_FOUND
            )


class AttendanceSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceSummary.objects.all()
    serializer_class = AttendanceSummarySerializer
    permission_classes = [IsAuthenticated]
