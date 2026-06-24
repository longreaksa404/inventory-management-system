from rest_framework import serializers
from apps.reports.models import (
    InventorySnapshot,
    LowStockAlert,
    CategorySummary,
    TransactionHistory, SalesReportEntry, PurchaseReportEntry, StockReportEntry
)


class InventorySnapshotSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = InventorySnapshot
        fields = ["id", "warehouse", "warehouse_name", "total_value", "created_at"]


class LowStockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = LowStockAlert
        fields = [
            "id",
            "product",
            "product_name",
            "warehouse",
            "warehouse_name",
            "quantity",
            "reorder_level",
            "triggered_at",
        ]


class CategorySummarySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = CategorySummary
        fields = [
            "id",
            "category",
            "category_name",
            "total_quantity",
            "total_value",
            "generated_at",
        ]


class TransactionHistorySerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = TransactionHistory
        fields = [
            "id",
            "transaction_type",
            "order_id",
            "warehouse",
            "warehouse_name",
            "user",
            "user_name",
            "status",
            "created_at",
        ]

class SalesReportEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesReportEntry
        fields = "__all__"

class PurchaseReportEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseReportEntry
        fields = "__all__"

class StockReportEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StockReportEntry
        fields = "__all__"
