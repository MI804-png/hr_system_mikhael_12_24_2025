from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from django.utils import timezone

from .models import (
    FinancialAuditLog, ComplianceRecord, TaxFilingRecord,
    FinancialRiskAssessment, TerminationFinancials
)
from .serializers import (
    FinancialAuditLogSerializer, ComplianceRecordSerializer, TaxFilingRecordSerializer,
    FinancialRiskAssessmentSerializer, TerminationFinancialsSerializer
)


class FinancialAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FinancialAuditLog.objects.all()
    serializer_class = FinancialAuditLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'transaction_type', 'action']
    
    @action(detail=False, methods=['get'])
    def employee_audit(self, request):
        """Get audit log for specific employee"""
        employee_id = request.query_params.get('employee_id')
        logs = FinancialAuditLog.objects.filter(employee_id=employee_id)
        return Response(FinancialAuditLogSerializer(logs, many=True).data)
    
    @action(detail=False, methods=['get'])
    def non_compliant(self, request):
        """Get non-compliant transactions"""
        logs = FinancialAuditLog.objects.filter(is_compliant=False)
        return Response(FinancialAuditLogSerializer(logs, many=True).data)
    
    @action(detail=False, methods=['get'])
    def date_range(self, request):
        """Get audit logs for date range"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        logs = FinancialAuditLog.objects.all()
        if start_date:
            logs = logs.filter(timestamp__gte=start_date)
        if end_date:
            logs = logs.filter(timestamp__lte=end_date)
        
        return Response(FinancialAuditLogSerializer(logs, many=True).data)


class ComplianceRecordViewSet(viewsets.ModelViewSet):
    queryset = ComplianceRecord.objects.all()
    serializer_class = ComplianceRecordSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['compliance_type', 'status', 'jurisdiction']
    
    @action(detail=False, methods=['get'])
    def non_compliant(self, request):
        """Get all non-compliant records"""
        records = ComplianceRecord.objects.filter(status='non_compliant')
        return Response(ComplianceRecordSerializer(records, many=True).data)
    
    @action(detail=False, methods=['get'])
    def pending_remediation(self, request):
        """Get records with pending remediation"""
        records = ComplianceRecord.objects.filter(
            remediation_required=True,
            remediation_completed_date__isnull=True
        )
        return Response(ComplianceRecordSerializer(records, many=True).data)
    
    @action(detail=True, methods=['post'])
    def mark_remediated(self, request, pk=None):
        """Mark compliance issue as remediated"""
        record = self.get_object()
        record.remediation_completed_date = timezone.now().date()
        record.status = 'compliant'
        record.save()
        return Response(ComplianceRecordSerializer(record).data)


class TaxFilingRecordViewSet(viewsets.ModelViewSet):
    queryset = TaxFilingRecord.objects.all()
    serializer_class = TaxFilingRecordSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['filing_type', 'status']
    
    @action(detail=False, methods=['get'])
    def upcoming_due(self, request):
        """Get upcoming tax filings due"""
        today = timezone.now().date()
        records = TaxFilingRecord.objects.filter(
            due_date__gte=today,
            status__in=['draft', 'pending']
        ).order_by('due_date')
        return Response(TaxFilingRecordSerializer(records, many=True).data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tax filings"""
        today = timezone.now().date()
        records = TaxFilingRecord.objects.filter(
            due_date__lt=today,
            status__in=['draft', 'pending']
        )
        return Response(TaxFilingRecordSerializer(records, many=True).data)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit tax filing"""
        record = self.get_object()
        record.status = 'submitted'
        record.filed_date = timezone.now().date()
        record.filed_by = request.user
        record.save()
        return Response(TaxFilingRecordSerializer(record).data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark tax payment as made"""
        record = self.get_object()
        record.status = 'paid'
        record.paid_date = timezone.now().date()
        record.save()
        return Response(TaxFilingRecordSerializer(record).data)


class FinancialRiskAssessmentViewSet(viewsets.ModelViewSet):
    queryset = FinancialRiskAssessment.objects.all()
    serializer_class = FinancialRiskAssessmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['risk_level']
    
    @action(detail=False, methods=['get'])
    def high_risk(self, request):
        """Get high and critical risk assessments"""
        assessments = FinancialRiskAssessment.objects.filter(
            risk_level__in=['high', 'critical']
        )
        return Response(FinancialRiskAssessmentSerializer(assessments, many=True).data)
    
    @action(detail=True, methods=['post'])
    def update_mitigation(self, request, pk=None):
        """Update mitigation progress"""
        assessment = self.get_object()
        assessment.mitigation_status = request.data.get('status', assessment.mitigation_status)
        assessment.mitigation_deadline = request.data.get('deadline', assessment.mitigation_deadline)
        assessment.save()
        return Response(FinancialRiskAssessmentSerializer(assessment).data)


class TerminationFinancialsViewSet(viewsets.ModelViewSet):
    queryset = TerminationFinancials.objects.all()
    serializer_class = TerminationFinancialsSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'employee']
    
    @action(detail=False, methods=['get'])
    def pending_processing(self, request):
        """Get terminations pending financial processing"""
        records = TerminationFinancials.objects.filter(status='pending')
        return Response(TerminationFinancialsSerializer(records, many=True).data)
    
    @action(detail=True, methods=['post'])
    def mark_processed(self, request, pk=None):
        """Mark termination financials as processed"""
        record = self.get_object()
        record.status = 'completed'
        record.processed_by = request.user
        record.processed_date = timezone.now().date()
        record.save()
        return Response(TerminationFinancialsSerializer(record).data)
    
    @action(detail=True, methods=['post'])
    def update_paycheck_status(self, request, pk=None):
        """Update final paycheck status"""
        record = self.get_object()
        record.final_paycheck_status = request.data.get('status', record.final_paycheck_status)
        record.save()
        return Response(TerminationFinancialsSerializer(record).data)
