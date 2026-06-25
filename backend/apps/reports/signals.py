# apps/reports/signals.py
#
# FIX: The original file registered a post_save receiver on LowStockAlert
# that called StockReportEntry.objects.get_or_create() — the exact same
# thing inventory/signals.py already does.  Two receivers on the same sender
# means get_or_create ran twice per alert save AND the email fired twice.
#
# Resolution: inventory/signals.py owns the LowStockAlert → StockReportEntry
# + email responsibility.  This file owns Sales/Purchase report entries only.

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.orders.models import SaleOrder, PurchaseOrder
from apps.reports.models import SalesReportEntry, PurchaseReportEntry


@receiver(post_save, sender=SaleOrder)
def create_sales_report_entry(sender, instance, **kwargs):
    if instance.status == "completed":
        # FIX: SaleOrder has no total_amount field. The original code used
        # getattr(instance, "total_amount", None) which always returned None
        # (because the field doesn't exist), then fell through to the sum
        # anyway. The dead getattr guard has been removed for clarity.
        total = sum(
            item.quantity * item.unit_price
            for item in instance.items.all()
        )
        SalesReportEntry.objects.get_or_create(
            order=instance,
            defaults={"total_amount": total},
        )


@receiver(post_save, sender=PurchaseOrder)
def create_purchase_report_entry(sender, instance, **kwargs):
    if instance.status == "received":
        # Same fix as above — PurchaseOrder also has no total_amount field.
        total = sum(
            item.quantity * item.unit_price
            for item in instance.items.all()
        )
        PurchaseReportEntry.objects.get_or_create(
            order=instance,
            defaults={"total_cost": total},
        )