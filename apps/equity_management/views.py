from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Sum, F, Count
from datetime import datetime, timedelta

from .models import (
    StockOptionPlan, EquityGrant, VestingSchedule, EquityExercise,
    ESOP, ESOPParticipant, EquityReport
)
from .serializers import (
    StockOptionPlanSerializer, EquityGrantSerializer, EquityGrantDetailedSerializer,
    VestingScheduleSerializer, EquityExerciseSerializer, ESOPSerializer,
    ESOPParticipantSerializer, ESOPParticipantDetailedSerializer, EquityReportSerializer
)
from apps.employees.models import Employee


class StockOptionPlanViewSet(viewsets.ModelViewSet):
    """Manage stock option plans"""
    queryset = StockOptionPlan.objects.all()
    serializer_class = StockOptionPlanSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plan_type', 'is_active']
    ordering_fields = ['start_date', 'name']
    ordering = ['-start_date']

    @action(detail=True, methods=['get'])
    def active_grants(self, request, pk=None):
        """Get all active grants for this plan"""
        plan = self.get_object()
        grants = EquityGrant.objects.filter(plan=plan, status__in=['APPROVED', 'GRANTED', 'VESTING', 'VESTED'])
        serializer = EquityGrantSerializer(grants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def close_plan(self, request, pk=None):
        """Close the stock option plan"""
        plan = self.get_object()
        plan.is_active = False
        plan.end_date = timezone.now().date()
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data)


class EquityGrantViewSet(viewsets.ModelViewSet):
    """Manage equity grants to employees"""
    queryset = EquityGrant.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['employee', 'plan', 'status', 'department']
    ordering_fields = ['grant_date', 'vesting_end_date', 'number_of_shares']
    ordering = ['-grant_date']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EquityGrantDetailedSerializer
        return EquityGrantSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an equity grant"""
        grant = self.get_object()
        if grant.status != 'PENDING':
            return Response({'error': 'Only pending grants can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        grant.status = 'APPROVED'
        grant.approved_by = request.user.employee
        grant.approved_date = timezone.now().date()
        grant.save()
        
        serializer = self.get_serializer(grant)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def grant(self, request, pk=None):
        """Grant the equity grant (change status to GRANTED)"""
        grant = self.get_object()
        if grant.status != 'APPROVED':
            return Response({'error': 'Only approved grants can be granted'}, status=status.HTTP_400_BAD_REQUEST)
        
        grant.status = 'GRANTED'
        grant.save()
        
        # Create vesting schedule if not exists
        if not grant.vesting_events.exists():
            self._create_vesting_schedule(grant)
        
        serializer = self.get_serializer(grant)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an equity grant"""
        grant = self.get_object()
        grant.status = 'CANCELLED'
        grant.save()
        serializer = self.get_serializer(grant)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def employee_vesting(self, request):
        """Get vesting summary for all employees"""
        grants = EquityGrant.objects.filter(status__in=['VESTING', 'VESTED'])
        data = {}
        for grant in grants:
            emp_id = grant.employee.id
            if emp_id not in data:
                data[emp_id] = {
                    'employee': grant.employee.get_full_name(),
                    'total_vested': 0,
                    'total_unvested': 0,
                    'grants': []
                }
            data[emp_id]['total_vested'] += grant.shares_vested
            data[emp_id]['total_unvested'] += grant.number_of_shares - grant.shares_vested
            data[emp_id]['grants'].append({
                'grant_number': grant.grant_number,
                'vesting_percentage': grant.vesting_percentage
            })
        return Response(list(data.values()))

    @action(detail=False, methods=['get'])
    def upcoming_vesting(self, request):
        """Get grants vesting in next 30 days"""
        today = timezone.now().date()
        future = today + timedelta(days=30)
        
        upcoming = VestingSchedule.objects.filter(
            vesting_date__range=[today, future],
            is_vested=False
        ).select_related('grant__employee').order_by('vesting_date')
        
        data = []
        for event in upcoming:
            data.append({
                'employee': event.grant.employee.get_full_name(),
                'grant_number': event.grant.grant_number,
                'shares': event.shares_to_vest,
                'vesting_date': event.vesting_date
            })
        return Response(data)

    def _create_vesting_schedule(self, grant):
        """Create vesting schedule from grant details"""
        # 4-year vesting with 1-year cliff as default
        cliff_date = grant.vesting_start_date + timedelta(days=grant.cliff_months * 30)
        
        # Create first vesting event (cliff)
        shares_per_month = grant.number_of_shares / 48  # 4-year vesting
        
        current_date = cliff_date
        while current_date <= grant.vesting_end_date:
            shares = int(shares_per_month)
            VestingSchedule.objects.create(
                grant=grant,
                vesting_date=current_date,
                shares_to_vest=shares
            )
            current_date += timedelta(days=30)


class VestingScheduleViewSet(viewsets.ModelViewSet):
    """Track vesting events"""
    queryset = VestingSchedule.objects.all()
    serializer_class = VestingScheduleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['grant', 'is_vested']
    ordering_fields = ['vesting_date']
    ordering = ['vesting_date']

    @action(detail=True, methods=['post'])
    def mark_vested(self, request, pk=None):
        """Mark vesting event as completed"""
        event = self.get_object()
        event.is_vested = True
        event.vested_date = timezone.now().date()
        event.save()
        
        # Update grant shares_vested
        grant = event.grant
        grant.shares_vested = grant.vesting_events.filter(is_vested=True).aggregate(Sum('shares_to_vest'))['shares_to_vest__sum'] or 0
        
        # Update status if fully vested
        if grant.shares_vested >= grant.number_of_shares:
            grant.status = 'VESTED'
        else:
            grant.status = 'VESTING'
        grant.save()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)


class EquityExerciseViewSet(viewsets.ModelViewSet):
    """Track stock option exercises"""
    queryset = EquityExercise.objects.all()
    serializer_class = EquityExerciseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['grant', 'status']
    ordering_fields = ['exercise_date']
    ordering = ['-exercise_date']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an exercise request"""
        exercise = self.get_object()
        if exercise.status != 'PENDING':
            return Response({'error': 'Only pending exercises can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        exercise.status = 'APPROVED'
        exercise.approved_by = request.user.employee
        exercise.approved_date = timezone.now().date()
        exercise.save()
        
        serializer = self.get_serializer(exercise)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete an exercise"""
        exercise = self.get_object()
        if exercise.status != 'APPROVED':
            return Response({'error': 'Only approved exercises can be completed'}, status=status.HTTP_400_BAD_REQUEST)
        
        exercise.status = 'COMPLETED'
        exercise.completed_date = timezone.now().date()
        
        # Update grant shares_exercised
        grant = exercise.grant
        grant.shares_exercised = grant.exercises.filter(status='COMPLETED').aggregate(Sum('shares_exercised'))['shares_exercised__sum'] or 0
        grant.save()
        
        exercise.save()
        serializer = self.get_serializer(exercise)
        return Response(serializer.data)


class ESOPViewSet(viewsets.ModelViewSet):
    """Manage Employee Stock Ownership Plans"""
    queryset = ESOP.objects.all()
    serializer_class = ESOPSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status']
    ordering_fields = ['start_date', 'name']
    ordering = ['-start_date']

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Get all participants in this ESOP"""
        esop = self.get_object()
        participants = esop.participants.all()
        serializer = ESOPParticipantSerializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get ESOP statistics"""
        esop = self.get_object()
        total_participants = esop.participants.filter(status='ENROLLED').count()
        total_shares = esop.participants.filter(status='ENROLLED').aggregate(Sum('shares_owned'))['shares_owned__sum'] or 0
        total_contributions = esop.participants.aggregate(Sum('total_contributions'))['total_contributions__sum'] or 0
        
        return Response({
            'total_participants': total_participants,
            'total_shares_allocated': total_shares,
            'total_contributions': str(total_contributions),
            'shares_available': esop.shares_available
        })


class ESOPParticipantViewSet(viewsets.ModelViewSet):
    """Manage ESOP participants"""
    queryset = ESOPParticipant.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['esop', 'employee', 'status']
    ordering_fields = ['enrollment_date']
    ordering = ['-enrollment_date']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ESOPParticipantDetailedSerializer
        return ESOPParticipantSerializer

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """Enroll employee in ESOP"""
        participant = self.get_object()
        participant.status = 'ENROLLED'
        participant.enrollment_date = timezone.now().date()
        participant.save()
        serializer = self.get_serializer(participant)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Withdraw employee from ESOP"""
        participant = self.get_object()
        participant.status = 'WITHDRAWN'
        participant.withdrawal_date = timezone.now().date()
        participant.save()
        serializer = self.get_serializer(participant)
        return Response(serializer.data)


class EquityReportViewSet(viewsets.ModelViewSet):
    """Generate and view equity reports"""
    queryset = EquityReport.objects.all()
    serializer_class = EquityReportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['report_type']
    ordering_fields = ['report_date']
    ordering = ['-report_date']

    @action(detail=False, methods=['post'])
    def generate_summary(self, request):
        """Generate equity summary report"""
        today = timezone.now().date()
        
        total_shares = EquityGrant.objects.filter(status__in=['GRANTED', 'VESTING', 'VESTED']).aggregate(Sum('number_of_shares'))['number_of_shares__sum'] or 0
        total_value = EquityGrant.objects.filter(status__in=['GRANTED', 'VESTING', 'VESTED']).aggregate(Sum('grant_value'))['grant_value__sum'] or 0
        
        report = EquityReport.objects.create(
            report_type='SUMMARY',
            report_date=today,
            total_shares_outstanding=total_shares,
            total_awards_value=total_value,
            expense_recognition=total_value,
            created_by=request.user.employee
        )
        
        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
