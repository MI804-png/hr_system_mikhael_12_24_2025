from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import CafeteriaMenu, CafeteriaOrder, CafeteriaBalance, CafeteriaTransaction
from .serializers import (
    CafeteriaMenuSerializer, CafeteriaOrderSerializer,
    CafeteriaBalanceSerializer, CafeteriaTransactionSerializer
)
from apps.employees.models import Employee

class CafeteriaMenuViewSet(viewsets.ModelViewSet):
    queryset = CafeteriaMenu.objects.all()
    serializer_class = CafeteriaMenuSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Only admins can create menu items
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def today_menu(self, request):
        """Get today's menu"""
        today = timezone.now().date()
        menu_items = CafeteriaMenu.objects.filter(
            available_date=today,
            is_available=True
        )
        serializer = CafeteriaMenuSerializer(menu_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get menu items by category"""
        category = request.query_params.get('category')
        if not category:
            return Response(
                {'detail': 'Category parameter required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        menu_items = CafeteriaMenu.objects.filter(category=category, is_available=True)
        serializer = CafeteriaMenuSerializer(menu_items, many=True)
        return Response(serializer.data)


class CafeteriaOrderViewSet(viewsets.ModelViewSet):
    serializer_class = CafeteriaOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin() or user.is_manager():
            return CafeteriaOrder.objects.all()
        
        try:
            employee = Employee.objects.get(user=user)
            return CafeteriaOrder.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return CafeteriaOrder.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Create a new cafeteria order"""
        try:
            employee = Employee.objects.get(user=request.user)
            menu_item_id = request.data.get('menu_item')
            quantity = int(request.data.get('quantity', 1))
            
            menu_item = CafeteriaMenu.objects.get(id=menu_item_id)
            
            # Check cafeteria balance
            try:
                balance = CafeteriaBalance.objects.get(employee=employee)
            except CafeteriaBalance.DoesNotExist:
                balance = CafeteriaBalance.objects.create(employee=employee)
            
            total_cost = menu_item.price * quantity
            if balance.total_spent + total_cost > balance.monthly_limit:
                return Response(
                    {'detail': 'Monthly spending limit exceeded.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create order
            request.data._mutable = True
            request.data['employee'] = employee.id
            return super().create(request, *args, **kwargs)
            
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'Employee profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def mark_ready(self, request, pk=None):
        """Mark order as ready"""
        if not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        order.status = 'ready'
        order.save()
        return Response(CafeteriaOrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def mark_collected(self, request, pk=None):
        """Mark order as collected"""
        order = self.get_object()
        
        if order.employee.user != request.user and not request.user.is_admin():
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order.status = 'collected'
        order.collection_date = timezone.now()
        order.save()
        
        # Update balance
        balance = order.employee.cafeteria_balance
        balance.total_spent += order.total_price
        balance.total_orders += 1
        balance.save()
        
        # Create transaction
        CafeteriaTransaction.objects.create(
            balance=balance,
            transaction_type='order',
            amount=order.total_price,
            description=f"Order: {order.menu_item.name}",
            order=order,
            created_by=request.user
        )
        
        return Response(CafeteriaOrderSerializer(order).data)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get user's orders"""
        try:
            employee = Employee.objects.get(user=request.user)
            orders = CafeteriaOrder.objects.filter(employee=employee).order_by('-order_date')
            serializer = CafeteriaOrderSerializer(orders, many=True)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'Employee profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class CafeteriaBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CafeteriaBalance.objects.all()
    serializer_class = CafeteriaBalanceSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_balance(self, request):
        """Get user's cafeteria balance"""
        try:
            employee = Employee.objects.get(user=request.user)
            balance = CafeteriaBalance.objects.get(employee=employee)
            serializer = CafeteriaBalanceSerializer(balance)
            return Response(serializer.data)
        except (Employee.DoesNotExist, CafeteriaBalance.DoesNotExist):
            return Response(
                {'detail': 'Cafeteria balance not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
