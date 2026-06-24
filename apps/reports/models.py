from django.db import models
from django.conf import settings
from apps.inventory.models import Product, Category
from apps.warehouses.models import Warehouse
from apps.orders.models import PurchaseOrder, SaleOrder


class InventorySnapshot(models.Model):
    warehouse = models.ForeignKey("warehouses.Warehouse", on_delete=models.CASCADE, null=True, blank=True)
    total_value = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Snapshot {self.created_at} - {self.total_value}"


class LowStockAlert(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="low_stock_alerts")
    warehouse = models.ForeignKey("warehouses.Warehouse", on_delete=models.PROTECT, related_name="low_stock_alerts")
    quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=1)
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product", "warehouse")
        ordering = ["-triggered_at"]

    def __str__(self):
        return f"{self.product.name} low stock ({self.quantity}/{self.reorder_level})"


class CategorySummary(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="summaries")
    total_quantity = models.PositiveIntegerField()
    total_value = models.DecimalField(max_digits=15, decimal_places=2)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.category.name} summary at {self.generated_at}"


class TransactionHistory(models.Model):
    TRANSACTION_TYPES = (
        ("purchase", "Purchase Order"),
        ("sale", "Sales Order"),
    )

    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    order_id = models.PositiveIntegerField()
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="transactions", null=True,
                                  blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="transactions")
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_type} #{self.order_id} - {self.status}"


class SalesReportEntry(models.Model):
    order = models.OneToOneField("orders.SaleOrder", on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sales Report for Order {self.order.id}"


class PurchaseReportEntry(models.Model):
    order = models.OneToOneField("orders.PurchaseOrder", on_delete=models.CASCADE)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Purchase Report for Order {self.order.id}"


class StockReportEntry(models.Model):
    alert = models.OneToOneField(
        LowStockAlert,
        on_delete=models.CASCADE,
        related_name="report_entry"
    )
    product_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Stock Report for {self.product_name} (qty {self.quantity})"
