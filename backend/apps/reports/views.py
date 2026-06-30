# apps/reports/views.py
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.inventory.models import Product
from apps.orders.models import PurchaseOrder, SaleOrder, PurchaseOrderItem, SaleOrderItem
from apps.reports.models import (
    InventorySnapshot,
    CategorySummary,
    TransactionHistory,
    SalesReportEntry,
    PurchaseReportEntry,
    StockReportEntry,
)
from apps.reports.serializers import (
    InventorySnapshotSerializer,
    CategorySummarySerializer,
    TransactionHistorySerializer,
    SalesReportEntrySerializer,
    PurchaseReportEntrySerializer,
    StockReportEntrySerializer,
)


class InventoryValueReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.all()
        total_value = sum(p.price * p.quantity for p in products)
        return Response({
            "total_value": total_value,
            "snapshot": {"warehouse": None, "total_value": total_value},
        })


class LowStockReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Two aggregated querysets merged in Python — O(1) queries regardless
        # of dataset size.

        purchased = (
            PurchaseOrderItem.objects
            .values('product_id', 'order__warehouse_id')
            .annotate(total_purchased=Sum('quantity'))
        )

        sold = (
            SaleOrderItem.objects
            .values('product_id', 'order__warehouse_id')
            .annotate(total_sold=Sum('quantity'))
        )

        sold_map = {
            (s['product_id'], s['order__warehouse_id']): s['total_sold'] or 0
            for s in sold
        }

        # Pre-fetch product info (id → name, reorder_level) in one query
        product_map = {
            p.id: {'name': p.name, 'reorder_level': p.reorder_level}
            for p in Product.objects.only('id', 'name', 'reorder_level')
        }

        # Pre-fetch warehouse names in one query
        from apps.warehouses.models import Warehouse
        warehouse_map = {
            w.id: w.name
            for w in Warehouse.objects.only('id', 'name')
        }

        alerts = []
        for row in purchased:
            product_id = row['product_id']
            warehouse_id = row['order__warehouse_id']
            total_purchased = row['total_purchased'] or 0
            total_sold = sold_map.get((product_id, warehouse_id), 0)
            net_stock = max(total_purchased - total_sold, 0)
            product_info = product_map.get(product_id, {})
            reorder_level = product_info.get('reorder_level', 0)

            if net_stock <= reorder_level:
                alerts.append({
                    "product": product_id,
                    "product_name": product_info.get('name', f'Product #{product_id}'),
                    "warehouse": warehouse_id,
                    "warehouse_name": warehouse_map.get(warehouse_id, f'Warehouse #{warehouse_id}'),
                    "quantity": net_stock,
                    "reorder_level": reorder_level,
                })

        return Response(alerts)


class CategorySummaryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = Product.objects.values(
            "category__id", "category__name"
        ).annotate(
            total_quantity=Sum("quantity"),
            total_value=Sum(F("quantity") * F("price")),
        )
        return Response([
            {
                "category_id": s["category__id"],
                "category_name": s["category__name"],
                "total_quantity": s["total_quantity"],
                "total_value": s["total_value"],
            }
            for s in summary
        ])


class TransactionHistoryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        purchases = PurchaseOrder.objects.values(
            "id", "supplier__name", "status", "created_at"
        )
        sales = SaleOrder.objects.values(
            "id", "customer__username", "status", "created_at"
        )
        transactions = [
            {
                "transaction_type": "purchase",
                "order_id": p["id"],
                "supplier": p["supplier__name"],
                "status": p["status"],
                "created_at": p["created_at"],
            }
            for p in purchases
        ] + [
            {
                "transaction_type": "sale",
                "order_id": s["id"],
                "customer": s["customer__username"],
                "status": s["status"],
                "created_at": s["created_at"],
            }
            for s in sales
        ]
        return Response(transactions)


class SalesReportEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SalesReportEntry.objects.all().order_by("-created_at")
    serializer_class = SalesReportEntrySerializer
    permission_classes = [IsAuthenticated]


class PurchaseReportEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PurchaseReportEntry.objects.all().order_by("-created_at")
    serializer_class = PurchaseReportEntrySerializer
    permission_classes = [IsAuthenticated]


class StockReportEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockReportEntry.objects.all().order_by("-created_at")
    serializer_class = StockReportEntrySerializer
    permission_classes = [IsAuthenticated]