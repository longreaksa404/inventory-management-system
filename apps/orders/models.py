from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from apps.inventory.models import Product, LowStockAlert
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from django.conf import settings


class BaseOrder(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('received', 'Received'),
        ('invoiced', 'Invoiced'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="%(class)s_orders")
    status = models.CharField(choices=STATUS_CHOICES, max_length=10, default='draft')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="%(class)s_orders")

    class Meta:
        abstract = True
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.__class__.__name__} #{self.pk} - {self.status}"


class PurchaseOrder(BaseOrder):
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    expected_date = models.DateField(null=True, blank=True)

    class Meta:
        # custom permissions
        permissions = [
            ("confirm_purchase_order", "Can confirm purchase orders"),
            ("receive_purchase_order", "Can receive purchase orders"),
            ("cancel_purchase_order", "Can cancel purchase orders"),
        ]

    def receive(self):
        if self.status != 'confirmed':
            raise ValidationError("Only confirmed purchase orders can be received.")
        with transaction.atomic():
            for item in self.items.all():
                product = Product.objects.select_for_update().get(pk=item.product_id)
                product.quantity += item.quantity
                product.save()
            self.status = 'received'
            self.save()

    def update_status_from_items(self):
        statuses = set(self.items.values_list('line_status', flat=True))
        if statuses == {'received'}:
            self.status = 'received'
        elif 'pending' in statuses:
            self.status = 'confirmed'
        elif 'shipped' in statuses and 'pending' not in statuses:
            self.status = 'shipped'
        self.save()


class PurchaseOrderItem(models.Model):
    order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True,
                                   blank=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    notes = models.TextField(blank=True)
    line_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('shipped', 'Shipped'), ('received', 'Received'), ('cancelled', 'Cancelled')],
        default='pending'
    )

    def line_total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class SaleOrder(BaseOrder):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sales_orders',
        limit_choices_to={'role': 'customer'}
    )
    order_date = models.DateField(auto_now_add=True)
    shipped_date = models.DateField(null=True, blank=True)

    class Meta:
        permissions = [
            ("confirm_sale_order", "Can confirm sales orders"),
            ("ship_sale_order", "Can ship sales orders"),
            ("invoice_sale_order", "Can invoice sales orders"),
            ("cancel_sale_order", "Can cancel sales orders"),
        ]

    def ship(self):
        if self.status != 'confirmed':
            raise ValidationError("Only confirmed sales orders can be shipped.")

        with transaction.atomic():
            for item in self.items.all():
                product = item.product
                if product.quantity < item.quantity:
                    raise ValidationError(f"Not enough stock for {product.name}")

                product.quantity -= item.quantity
                product.save()

                if product.quantity <= product.reorder_level:
                    LowStockAlert.objects.create(product=product)

            self.status = 'shipped'
            self.shipped_date = timezone.now()
            self.save()

    def update_status_from_items(self):
        statuses = set(self.items.values_list('line_status', flat=True))
        if statuses == {'received'}:
            self.status = 'received'
        elif 'pending' in statuses:
            self.status = 'confirmed'
        elif 'shipped' in statuses and 'pending' not in statuses:
            self.status = 'shipped'
        self.save()


class SaleOrderItem(models.Model):
    order = models.ForeignKey(SaleOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    notes = models.TextField(blank=True)

    def line_total(self):
        return (self.quantity * self.unit_price) - self.discount

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class OrderStatusHistory(models.Model):
    order_type = models.CharField(max_length=20)
    order_id = models.PositiveIntegerField()
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
