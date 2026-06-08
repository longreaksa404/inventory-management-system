# apps/inventory/serializers.py
from decimal import Decimal
from rest_framework import serializers
from .models import Category, Product, StockTransaction, LowStockAlert


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.StringRelatedField(source='category', read_only=True)
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0"),
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'status',
            'category', 'category_name',
            'price', 'quantity', 'reorder_level'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StockTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.StringRelatedField(source='product', read_only=True)
    warehouse_name = serializers.StringRelatedField(source='warehouse', read_only=True)
    performed_by_name = serializers.StringRelatedField(source='performed_by', read_only=True)

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'product', 'product_name',
            'warehouse', 'warehouse_name',
            'performed_by', 'performed_by_name',
            'transaction_type', 'quantity', 'notes', 'timestamp'
        ]
        read_only_fields = ['performed_by', 'timestamp']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['performed_by'] = user
        # FIX: StockTransaction.save() already calls apply_transaction() internally.
        # Calling it again here caused every stock movement to be applied twice.
        # super().create() triggers save() → apply_transaction() — that's enough.
        transaction = super().create(validated_data)
        return transaction


class StockSummarySerializer(serializers.ModelSerializer):
    category_name = serializers.StringRelatedField(source='category', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category', 'category_name', 'quantity']


class StockHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.StringRelatedField(source='product', read_only=True)
    warehouse_name = serializers.StringRelatedField(source='warehouse', read_only=True)
    performed_by_name = serializers.StringRelatedField(source='performed_by', read_only=True)
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )

    class Meta:
        model = StockTransaction
        fields = [
            'id',
            'timestamp',
            'transaction_type', 'transaction_type_display',
            'quantity',
            'product_name',
            'warehouse_name',
            'performed_by_name',
            'notes'
        ]


class LowStockAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = LowStockAlert
        fields = "__all__"