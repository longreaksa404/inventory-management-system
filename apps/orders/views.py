# apps/orders/views.py
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.orders.models import SaleOrder, PurchaseOrder, OrderStatusHistory
from apps.orders.serializers import PurchaseOrderSerializer, SalesOrderSerializer
from apps.orders.tasks import process_sales_order_shipping, process_purchase_order_receiving
from rest_framework.permissions import IsAuthenticated
from apps.orders.permissions import SaleOrderPermission, PurchaseOrderPermission
from apps.inventory.models import Product


# FIX: log_status_change was defined INSIDE SalesOrderViewSet as a broken
# instance method (no self, 4 positional args). Moved here as a proper
# module-level helper used by both ViewSets.
def log_status_change(order, old_status, new_status, user):
    OrderStatusHistory.objects.create(
        order_type=order.__class__.__name__.lower(),
        order_id=order.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=user,
    )


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().select_related('supplier', 'warehouse')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated, PurchaseOrderPermission]

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.status != "draft":
            return Response(
                {"detail": "Only draft orders can be confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        old_status = order.status
        order.status = "confirmed"
        order.save()
        log_status_change(order, old_status, order.status, request.user)
        return Response({"detail": "Order confirmed."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status != "confirmed":
            return Response(
                {"detail": "Only confirmed orders can be received."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        process_purchase_order_receiving.delay(order.id, request.user.id)
        return Response(
            {"detail": "Purchase order receiving started."},
            status=status.HTTP_202_ACCEPTED,
        )


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SaleOrder.objects.all().select_related('customer', 'warehouse')
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated, SaleOrderPermission]

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.status != 'draft':
            return Response(
                {"detail": "Only draft orders can be confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        old_status = order.status
        order.status = 'confirmed'
        order.save()
        # FIX: log_status_change is now the module-level function above,
        # not the broken shadowed method that was defined inside this class.
        log_status_change(order, old_status, order.status, request.user)
        return Response({"detail": "Sales order confirmed."})

    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        order = self.get_object()
        if order.status != "confirmed":
            return Response(
                {"detail": "Only confirmed orders can be shipped."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        process_sales_order_shipping.delay(order.id, request.user.id)
        return Response(
            {"detail": "Shipping started."},
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def invoice(self, request, pk=None):
        order = self.get_object()
        if order.status != 'shipped':
            return Response(
                {"detail": "Only shipped orders can be invoiced."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        old_status = order.status
        order.status = 'invoiced'
        order.save()
        log_status_change(order, old_status, order.status, request.user)
        return Response({"detail": "Sales order invoiced."})

    def update(self, request, *args, **kwargs):
        # FIX: Added select_for_update() inside an atomic block so concurrent
        # updates to the same order don't race past the stock check with stale reads.
        with transaction.atomic():
            instance = SaleOrder.objects.select_for_update().get(
                pk=self.kwargs['pk']
            )
            if request.data.get("status") == "completed":
                for item in instance.items.select_related('product'):
                    product = Product.objects.select_for_update().get(
                        pk=item.product_id
                    )
                    if product.quantity < item.quantity:
                        raise ValidationError(
                            f"Not enough stock for {product.name} "
                            f"(need {item.quantity}, have {product.quantity})"
                        )
        return super().update(request, *args, **kwargs)