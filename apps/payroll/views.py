from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta

from .models import (
    PayrollPeriod, TaxConfiguration, Deduction, PayCheck,
    PayrollDeduction, TimesheetEntry, Bonus, Raise, PayrollReport
)
from .serializers import (
    PayrollPeriodSerializer, TaxConfigurationSerializer, DeductionSerializer,
    PayCheckSerializer, PayCheckDetailSerializer, PayrollDeductionSerializer,
    TimesheetEntrySerializer, BonusSerializer, RaiseSerializer, PayrollReportSerializer
)


class PayrollPeriodViewSet(viewsets.ModelViewSet):
    queryset = PayrollPeriod.objects.all()
    serializer_class = PayrollPeriodSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current active payroll period"""
        current_period = PayrollPeriod.objects.filter(
            is_active=True,
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).first()
        if current_period:
            return Response(PayrollPeriodSerializer(current_period).data)
        return Response({'detail': 'No active payroll period'}, status=status.HTTP_404_NOT_FOUND)


class TaxConfigurationViewSet(viewsets.ModelViewSet):
    queryset = TaxConfiguration.objects.filter(is_active=True)
    serializer_class = TaxConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def effective_taxes(self, request):
        """Get all effective tax configurations"""
        today = timezone.now().date()
        taxes = TaxConfiguration.objects.filter(
            is_active=True,
            effective_date__lte=today
        ).filter(Q(expiration_date__isnull=True) | Q(expiration_date__gte=today))
        return Response(TaxConfigurationSerializer(taxes, many=True).data)


class DeductionViewSet(viewsets.ModelViewSet):
    queryset = Deduction.objects.filter(is_active=True)
    serializer_class = DeductionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'deduction_type']
    
    @action(detail=False, methods=['get'])
    def active_deductions(self, request):
        """Get active deductions for current date"""
        today = timezone.now().date()
        deductions = Deduction.objects.filter(
            is_active=True,
            start_date__lte=today
        ).filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
        return Response(DeductionSerializer(deductions, many=True).data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a deduction"""
        deduction = self.get_object()
        deduction.is_active = False
        deduction.end_date = timezone.now().date()
        deduction.save()
        return Response(DeductionSerializer(deduction).data)


class PayCheckViewSet(viewsets.ModelViewSet):
    queryset = PayCheck.objects.all()
    serializer_class = PayCheckSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'status', 'payroll_period']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PayCheckDetailSerializer
        return PayCheckSerializer
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Mark paycheck as processed"""
        paycheck = self.get_object()
        paycheck.status = 'processed'
        paycheck.save()
        return Response(PayCheckDetailSerializer(paycheck).data)
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Mark paycheck as paid"""
        paycheck = self.get_object()
        paycheck.status = 'paid'
        paycheck.paid_date = timezone.now().date()
        paycheck.save()
        return Response(PayCheckDetailSerializer(paycheck).data)
    
    @action(detail=False, methods=['get'])
    def employee_paychecks(self, request):
        """Get all paychecks for logged-in employee"""
        employee = request.user.employee_profile
        paychecks = PayCheck.objects.filter(employee=employee)
        serializer = self.get_serializer(paychecks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def void(self, request, pk=None):
        """Void a paycheck"""
        paycheck = self.get_object()
        paycheck.status = 'voided'
        paycheck.save()
        return Response(PayCheckDetailSerializer(paycheck).data)


class TimesheetEntryViewSet(viewsets.ModelViewSet):
    queryset = TimesheetEntry.objects.all()
    serializer_class = TimesheetEntrySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'date']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve timesheet entry"""
        entry = self.get_object()
        entry.approved_by = request.user
        entry.approved_date = timezone.now()
        entry.save()
        return Response(TimesheetEntrySerializer(entry).data)
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly timesheet summary for employee"""
        employee_id = request.query_params.get('employee_id')
        month = request.query_params.get('month')  # YYYY-MM
        
        entries = TimesheetEntry.objects.filter(employee_id=employee_id)
        if month:
            entries = entries.filter(date__startswith=month)
        
        summary = entries.aggregate(
            total_hours=Sum('hours_worked'),
            total_overtime=Sum('hours_worked', filter=Q(is_overtime=True)),
            entries_count=models.Count('id')
        )
        return Response(summary)


class BonusViewSet(viewsets.ModelViewSet):
    queryset = Bonus.objects.all()
    serializer_class = BonusSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'bonus_type', 'is_approved']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve bonus"""
        bonus = self.get_object()
        bonus.is_approved = True
        bonus.approved_by = request.user
        bonus.approved_date = timezone.now()
        bonus.save()
        return Response(BonusSerializer(bonus).data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending bonuses"""
        bonuses = Bonus.objects.filter(is_approved=False)
        serializer = self.get_serializer(bonuses, many=True)
        return Response(serializer.data)


class RaiseViewSet(viewsets.ModelViewSet):
    queryset = Raise.objects.all()
    serializer_class = RaiseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'is_approved']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve raise"""
        raise_obj = self.get_object()
        raise_obj.is_approved = True
        raise_obj.approved_by = request.user
        raise_obj.approved_date = timezone.now()
        raise_obj.save()
        return Response(RaiseSerializer(raise_obj).data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending raises"""
        raises = Raise.objects.filter(is_approved=False)
        serializer = self.get_serializer(raises, many=True)
        return Response(serializer.data)


class PayrollReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PayrollReport.objects.all()
    serializer_class = PayrollReportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['report_type', 'payroll_period']
