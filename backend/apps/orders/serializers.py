# apps/orders/serializers.py
from rest_framework import serializers
from django.db import transaction

from apps.orders.models import (
    PurchaseOrder, PurchaseOrderItem,
    SaleOrder, SaleOrderItem, OrderStatusHistory,
)
from apps.inventory.models import Product
from apps.suppliers.models import Supplier


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'notes', 'line_total']

    def get_line_total(self, obj):
        return obj.line_total()


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, write_only=True)
    items_detail = PurchaseOrderItemSerializer(source='items', many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    created_by = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'supplier', 'supplier_name', 'warehouse', 'warehouse_name',
            'status', 'expected_date', 'notes', 'created_at', 'updated_at',
            'created_by', 'items', 'items_detail',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        for item in value:
            if item['quantity'] <= 0:
                raise serializers.ValidationError("Quantity must be greater than zero.")
            if item['unit_price'] < 0:
                raise serializers.ValidationError("Unit price cannot be negative.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        order = PurchaseOrder.objects.create(created_by=user, **validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(order=order, **item)
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                PurchaseOrderItem.objects.create(order=instance, **item)
        return instance


# ---------------------------------------------------------------------------
# Sales order helpers
# ---------------------------------------------------------------------------

def _resolve_product(raw) -> Product:
    """
    FIX: The original code used isinstance(item['product'], Product) to
    decide whether to call .id — fragile because DRF resolves PrimaryKeyRelatedField
    to a model instance BEFORE validate_items runs. So the else-branch (raw int PK)
    never fired in practice, and the code only appeared to work.

    Now we handle both cases explicitly and clearly:
    - If DRF already resolved to a Product instance, use it directly.
    - If somehow a raw PK int arrives (e.g. custom field), look it up.
    """
    if isinstance(raw, Product):
        return raw
    try:
        return Product.objects.get(pk=raw)
    except Product.DoesNotExist:
        raise serializers.ValidationError(f"Product with pk={raw} does not exist.")


def _check_stock(product: Product, quantity: int):
    """Single place for stock availability check — called from validate_items only."""
    if product.quantity < quantity:
        raise serializers.ValidationError(
            f"Not enough stock for {product.name} "
            f"(need {quantity}, have {product.quantity})."
        )


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = SaleOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'discount', 'notes', 'line_total']

    def get_line_total(self, obj):
        return max((obj.quantity * obj.unit_price) - obj.discount, 0)


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, write_only=True)
    items_detail = SalesOrderItemSerializer(source='items', many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    created_by = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = SaleOrder
        fields = [
            'id', 'customer', 'customer_name', 'warehouse', 'warehouse_name',
            'status', 'order_date', 'shipped_date', 'notes',
            'created_at', 'updated_at', 'created_by',
            'items', 'items_detail',
        ]
        read_only_fields = ['order_date', 'created_at', 'updated_at', 'created_by']

    def validate_items(self, value):
        """
        FIX: Stock validation previously lived in THREE places:
          1. validate_items()
          2. validate()  — also checked status=="completed" edge cases
          3. SalesOrderViewSet.update() — yet another partial check

        Consolidated here into a single method. The views no longer duplicate
        this logic. validate() has been removed — all item-level validation
        belongs in validate_items() which DRF calls on every write operation.
        """
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        for item in value:
            if item['quantity'] <= 0:
                raise serializers.ValidationError("Quantity must be greater than zero.")
            if item['unit_price'] < 0:
                raise serializers.ValidationError("Unit price cannot be negative.")
            product = _resolve_product(item['product'])
            _check_stock(product, item['quantity'])
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        order = SaleOrder.objects.create(created_by=user, **validated_data)
        for item in items_data:
            SaleOrderItem.objects.create(order=order, **item)
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                SaleOrderItem.objects.create(order=instance, **item)
        return instance


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'order_type', 'order_id', 'old_status', 'new_status', 'changed_by_name', 'changed_at']