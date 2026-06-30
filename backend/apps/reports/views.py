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
        products = Product.objects.filter(
            quantity__lte=F('reorder_level')
        ).only('id', 'name', 'quantity', 'reorder_level')

        alerts = [
            {
                "product": p.id,
                "product_name": p.name,
                "warehouse": None,
                "warehouse_name": None,
                "quantity": p.quantity,
                "reorder_level": p.reorder_level,
            }
            for p in products
        ]

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