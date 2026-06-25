# apps/inventory/views.py
from rest_framework import permissions, generics, filters, viewsets, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

# FIX: Product was imported twice — once below from .models and again later
# from apps.inventory.models. The second import has been removed.
from .models import Category, Product, StockTransaction, LowStockAlert
from apps.warehouses.models import Warehouse
from apps.core.permissions import IsStaffOrReadOnly
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    StockTransactionSerializer,
    StockSummarySerializer,
    StockHistorySerializer,
    LowStockAlertSerializer,
)
from apps.inventory.permissions import (
    ProductPermission,
    ProductActionPermission,
    CategoryPermission,
    StockTransactionPermission,
    LowStockAlertPermission,
)


class SearchFilterOrderingMixin:
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]


class CategoryListCreateView(SearchFilterOrderingMixin, generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [CategoryPermission]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [CategoryPermission]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [ProductPermission]

    def get_permissions(self):
        if self.action == "discontinue":
            return [ProductActionPermission()]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def discontinue(self, request, pk=None):
        product = self.get_object()
        if product.status == "discontinued":
            return Response(
                {"detail": "Product is already discontinued."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if product.quantity > 0:
            return Response(
                {"detail": "Product stock must be 0 before discontinuing."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.status = "discontinued"
        product.save(update_fields=["status"])
        return Response(
            {"message": "Product discontinued successfully.", "product_id": product.id},
            status=status.HTTP_200_OK,
        )


class ProductListCreateView(SearchFilterOrderingMixin, generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [ProductPermission]
    filterset_fields = ['category', 'status']
    search_fields = ['name', 'sku', 'category__name']
    ordering_fields = ['name', 'sku', 'status', 'quantity', 'price', 'created_at']
    ordering = ['-created_at']


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [ProductPermission]


class StockTransactionListCreateView(SearchFilterOrderingMixin, generics.ListCreateAPIView):
    queryset = StockTransaction.objects.select_related('product', 'warehouse', 'performed_by')
    serializer_class = StockTransactionSerializer
    permission_classes = [StockTransactionPermission]
    filterset_fields = ['product', 'warehouse', 'transaction_type', 'performed_by']
    search_fields = ['product__name', 'product__sku', 'warehouse__name', 'notes']
    ordering_fields = ['timestamp', 'quantity', 'product__name']
    ordering = ['-timestamp']


class StockSummaryView(SearchFilterOrderingMixin, generics.ListAPIView):
    serializer_class = StockSummarySerializer
    permission_classes = [ProductPermission]
    filterset_fields = ['category', 'status', 'sku']
    search_fields = ['name', 'sku', 'category__name']
    ordering_fields = ['name', 'sku', 'quantity']
    ordering = ['name']

    def get_queryset(self):
        queryset = Product.objects.all()
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            queryset = queryset.filter(
                stock_transactions__warehouse_id=warehouse_id
            ).distinct()
        return queryset


class StockHistoryView(SearchFilterOrderingMixin, generics.ListAPIView):
    serializer_class = StockHistorySerializer
    permission_classes = [StockTransactionPermission]
    filterset_fields = ['transaction_type', 'warehouse', 'performed_by']
    search_fields = ['product__name', 'product__sku', 'notes']
    ordering_fields = ['timestamp', 'quantity']
    ordering = ['-timestamp']

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return StockTransaction.objects.filter(
            product_id=product_id
        ).order_by('-timestamp')


class LowStockAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LowStockAlert.objects.all().order_by("-triggered_at")
    serializer_class = LowStockAlertSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ['product', 'triggered_at']


# ---------------------------------------------------------------------------
# Stock mutation endpoints
# FIX: All three views now accept a `warehouse` query param and pass it to
# the model method so StockTransaction audit records are created correctly.
# Without warehouse the audit record is silently skipped (see inventory/models.py).
# ---------------------------------------------------------------------------

def _get_warehouse(request):
    """
    Resolve warehouse from request query param.
    Returns None if not provided — audit trail will be skipped and the
    caller should decide whether to enforce this.
    """
    warehouse_id = request.data.get("warehouse") or request.query_params.get("warehouse")
    if warehouse_id:
        return get_object_or_404(Warehouse, pk=warehouse_id)
    return None


class StockInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        qty = int(request.data.get("quantity", 0))
        if qty <= 0:
            return Response(
                {"detail": "Quantity must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        warehouse = _get_warehouse(request)
        product.increase_stock(qty, user=request.user, warehouse=warehouse)
        return Response({"stock": product.quantity}, status=status.HTTP_200_OK)


class StockOutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        qty = int(request.data.get("quantity", 0))
        if qty <= 0:
            return Response(
                {"detail": "Quantity must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        warehouse = _get_warehouse(request)
        try:
            product.decrease_stock(qty, user=request.user, warehouse=warehouse)
            return Response({"stock": product.quantity}, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {"detail": "Not enough stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AdjustStockView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        qty = int(request.data.get("quantity", product.quantity))
        reason = request.data.get("reason", "")
        warehouse = _get_warehouse(request)
        product.adjust_stock(qty, reason=reason, user=request.user, warehouse=warehouse)
        return Response({"stock": product.quantity}, status=status.HTTP_200_OK)