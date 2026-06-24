from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ProductViewSet,
    ProductListCreateView,
    ProductDetailView,
    StockTransactionListCreateView,
    StockSummaryView,
    StockHistoryView,
    LowStockAlertViewSet,
    StockInView,
    StockOutView,
    AdjustStockView,
)

router = DefaultRouter()
router.register(r"products-actions", ProductViewSet, basename="product-actions")
router.register(r"low-stock-alerts", LowStockAlertViewSet, basename="low-stock-alerts")

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),

    path("products/", ProductListCreateView.as_view(), name="product-list-create"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),

    path("transactions/", StockTransactionListCreateView.as_view(), name="transaction-list-create"),
    path("stock-summary/", StockSummaryView.as_view(), name="stock-summary"),
    path("stock-history/<int:product_id>/", StockHistoryView.as_view(), name="stock-history"),

    path("products/<int:pk>/stock/in/", StockInView.as_view(), name="stock-in"),
    path("products/<int:pk>/stock/out/", StockOutView.as_view(), name="stock-out"),
    path("products/<int:pk>/stock/adjust/", AdjustStockView.as_view(), name="stock-adjust"),

    path("", include(router.urls)),
]
