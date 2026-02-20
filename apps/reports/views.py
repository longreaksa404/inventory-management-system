from django.db.models import Sum, F
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.inventory.models import Product
from apps.orders.models import PurchaseOrder, SaleOrder, PurchaseOrderItem, SaleOrderItem
from apps.reports.models import (
    InventorySnapshot,
    CategorySummary,
    TransactionHistory, SalesReportEntry, PurchaseReportEntry, StockReportEntry,
)
from apps.reports.serializers import (
    InventorySnapshotSerializer,
    CategorySummarySerializer,
    TransactionHistorySerializer, SalesReportEntrySerializer, PurchaseReportEntrySerializer, StockReportEntrySerializer,
)


class InventoryValueReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.all()
        total_value = sum([p.price * p.quantity for p in products])

        snapshot_data = {
            "warehouse": None,
            "total_value": total_value,
        }

        return Response({
            "total_value": total_value,
            "snapshot": snapshot_data
        })


class LowStockReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = []

        for product in Product.objects.all():
            purchased = (
                PurchaseOrderItem.objects
                .filter(product=product)
                .values('order__warehouse')
                .annotate(total_purchased=Sum('quantity'))
            )

            sold = (
                SaleOrderItem.objects
                .filter(product=product)
                .values('order__warehouse')
                .annotate(total_sold=Sum('quantity'))
            )
            sold_map = {s['order__warehouse']: s['total_sold'] or 0 for s in sold}

            for p in purchased:
                warehouse_id = p['order__warehouse']
                total_purchased = p['total_purchased'] or 0
                total_sold = sold_map.get(warehouse_id, 0)
                net_stock = total_purchased - total_sold

                if net_stock < 0:
                    net_stock = 0

                if net_stock < product.reorder_level:
                    alerts.append({
                        "product": product.id,
                        "product_name": product.name,
                        "warehouse": warehouse_id,
                        "quantity": net_stock,
                        "reorder_level": product.reorder_level,
                    })

        return Response(alerts)


class CategorySummaryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = Product.objects.values("category__id", "category__name").annotate(
            total_quantity=Sum("quantity"),
            total_value=Sum(F("quantity") * F("price")),
        )

        summaries = [
            {
                "category_id": s["category__id"],
                "category_name": s["category__name"],
                "total_quantity": s["total_quantity"],
                "total_value": s["total_value"],
            }
            for s in summary
        ]

        return Response(summaries)


class TransactionHistoryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        purchases = PurchaseOrder.objects.values(
            "id", "supplier__name", "status", "created_at"
        )
        sales = SaleOrder.objects.values(
            "id", "customer__username", "status", "created_at"
        )

        transactions = []

        for p in purchases:
            transactions.append({
                "transaction_type": "purchase",
                "order_id": p["id"],
                "supplier": p["supplier__name"],
                "status": p["status"],
                "created_at": p["created_at"],
            })

        for s in sales:
            transactions.append({
                "transaction_type": "sale",
                "order_id": s["id"],
                "customer": s["customer__username"],
                "status": s["status"],
                "created_at": s["created_at"],
            })

        return Response(transactions)


class SalesReportEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SalesReportEntry.objects.all().order_by("-created_at")
    serializer_class = SalesReportEntrySerializer


class PurchaseReportEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PurchaseReportEntry.objects.all().order_by("-created_at")
    serializer_class = PurchaseReportEntrySerializer


class StockReportEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockReportEntry.objects.all().order_by("-created_at")
    serializer_class = StockReportEntrySerializer
