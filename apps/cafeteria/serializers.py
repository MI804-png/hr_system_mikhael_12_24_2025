from rest_framework import serializers
from .models import CafeteriaMenu, CafeteriaOrder, CafeteriaBalance, CafeteriaTransaction

class CafeteriaMenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = CafeteriaMenu
        fields = [
            'id', 'name', 'description', 'price', 'available_date',
            'category', 'is_available', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class CafeteriaOrderSerializer(serializers.ModelSerializer):
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_price = serializers.DecimalField(
        source='menu_item.price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = CafeteriaOrder
        fields = [
            'id', 'employee', 'employee_name', 'menu_item', 'menu_item_name',
            'menu_item_price', 'quantity', 'status', 'total_price',
            'order_date', 'collection_date', 'notes'
        ]
        read_only_fields = ['id', 'order_date', 'total_price']

class CafeteriaTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CafeteriaTransaction
        fields = [
            'id', 'balance', 'transaction_type', 'amount', 'description',
            'order', 'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at']

class CafeteriaBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    remaining_limit = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    transactions = CafeteriaTransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = CafeteriaBalance
        fields = [
            'id', 'employee', 'employee_name', 'total_spent',
            'total_orders', 'monthly_limit', 'remaining_limit',
            'last_updated', 'transactions'
        ]
        read_only_fields = [
            'id', 'total_spent', 'total_orders', 'last_updated'
        ]
