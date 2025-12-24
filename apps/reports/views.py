from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
from .models import Report, ReportFilter
from .serializers import ReportSerializer
from apps.salary.models import Salary
from apps.attendance.models import Attendance
from apps.employees.models import Employee
from apps.cafeteria.models import CafeteriaOrder

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Only admins and managers can create reports
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def payroll_report(self, request):
        """Generate payroll report"""
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not month or not year:
            return Response(
                {'detail': 'Month and year are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        salaries = Salary.objects.filter(month=month, year=year)
        
        report = Report.objects.create(
            report_type='payroll',
            title=f'Payroll Report - {month}/{year}',
            generated_by=request.user,
            start_date=datetime(int(year), int(month), 1).date()
        )
        
        # Generate PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        # Create data for table
        data = [['Employee', 'Base Salary', 'Deductions', 'Net Salary', 'Status']]
        total_net = 0
        
        for salary in salaries:
            data.append([
                salary.employee.user.get_full_name(),
                f'${salary.base_salary:.2f}',
                f'${salary.total_deductions:.2f}',
                f'${salary.net_salary:.2f}',
                salary.status
            ])
            total_net += salary.net_salary
        
        data.append(['', '', '', '', ''])
        data.append(['TOTAL', '', '', f'${total_net:.2f}', ''])
        
        # Create table
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, -2), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements = [table]
        doc.build(elements)
        
        buffer.seek(0)
        report.file.save(f'payroll_report_{month}_{year}.pdf', buffer)
        
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def attendance_report(self, request):
        """Generate attendance report"""
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not month or not year:
            return Response(
                {'detail': 'Month and year are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report = Report.objects.create(
            report_type='attendance',
            title=f'Attendance Report - {month}/{year}',
            generated_by=request.user
        )
        
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def employee_report(self, request):
        """Generate employee report"""
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        department = request.data.get('department')
        
        report = Report.objects.create(
            report_type='employee',
            title=f'Employee Report - {department or "All"}',
            generated_by=request.user
        )
        
        if department:
            ReportFilter.objects.create(
                report=report,
                filter_key='department',
                filter_value=department
            )
        
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def financial_report(self, request):
        """Generate financial report"""
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        report = Report.objects.create(
            report_type='financial',
            title=f'Financial Report - {start_date} to {end_date}',
            generated_by=request.user,
            start_date=start_date,
            end_date=end_date
        )
        
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download report file"""
        report = self.get_object()
        if report.file:
            return FileResponse(
                open(report.file.path, 'rb'),
                content_type='application/pdf',
                as_attachment=True,
                filename=f'{report.title}.pdf'
            )
        return Response(
            {'detail': 'Report file not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
