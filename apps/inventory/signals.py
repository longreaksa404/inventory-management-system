# apps/inventory/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from apps.reports.models import StockReportEntry, LowStockAlert
from django.core.mail import send_mail


@receiver(post_save, sender=LowStockAlert)
def create_stock_report_entry(sender, instance, created, **kwargs):
    """
    When a LowStockAlert is created:
      1. Create a StockReportEntry snapshot for reporting.
      2. Send an email notification to the configured admin address.

    FIX: Hard-coded personal email addresses replaced with settings variables
    (ADMIN_NOTIFICATION_EMAIL and DEFAULT_FROM_EMAIL) so the app can be
    deployed to any environment without touching source code.
    """
    if created:
        StockReportEntry.objects.get_or_create(
            alert=instance,
            defaults={
                "product_name": instance.product.name,
                "quantity": instance.reorder_level,
            },
        )

        send_mail(
            subject="Low Stock Alert",
            message=(
                f"{instance.product.name} is low on stock "
                f"({instance.quantity}/{instance.reorder_level})"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_NOTIFICATION_EMAIL],
        )