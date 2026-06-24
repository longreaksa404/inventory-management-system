from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.reports.views import (
    InventoryValueReportView,
    LowStockReportView,
    CategorySummaryReportView,
    TransactionHistoryReportView,
    SalesReportEntryViewSet,
    PurchaseReportEntryViewSet,
    StockReportEntryViewSet,
)

router = DefaultRouter()
router.register(r"sales-report-entries", SalesReportEntryViewSet, basename="sales-report")
router.register(r"purchase-report-entries", PurchaseReportEntryViewSet, basename="purchase-report")
router.register(r"stock-report-entries", StockReportEntryViewSet, basename="stock-report")

urlpatterns = [
    path("inventory-value/", InventoryValueReportView.as_view(), name="inventory-value-report"),
    path("low-stock/", LowStockReportView.as_view(), name="low-stock-report"),
    path("category-summary/", CategorySummaryReportView.as_view(), name="category-summary-report"),
    path("transaction-history/", TransactionHistoryReportView.as_view(), name="transaction-history-report"),

    path("", include(router.urls)),
]
