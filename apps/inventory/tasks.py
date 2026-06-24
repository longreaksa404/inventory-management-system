# apps/inventory/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.db.models import F
from django.conf import settings

from apps.inventory.models import Product


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def notify_low_stock(self):
    """
    Periodic Celery task that checks for low-stock products and emails
    the configured admin address.

    FIX 1: Was using quantity__lt=5 (hardcoded). Now uses
    quantity__lte=F('reorder_level') so each product's own threshold
    is respected rather than a one-size-fits-all magic number.

    FIX 2: Was sending to hardcoded personal email "longreak3@gmail.com".
    Now reads from settings.ADMIN_NOTIFICATION_EMAIL so the recipient
    can be configured per environment without touching source code.
    """
    low_stock_products = Product.objects.filter(
        quantity__lte=F('reorder_level')
    )

    if not low_stock_products.exists():
        return "No low stock products today."

    message_lines = [
        f"{p.name} (SKU: {p.sku}) → {p.quantity} left (reorder at {p.reorder_level})"
        for p in low_stock_products
    ]
    message = "\n".join(message_lines)

    send_mail(
        subject="Low Stock Alert",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.ADMIN_NOTIFICATION_EMAIL],
    )

    return f"Low stock notification sent for {low_stock_products.count()} products."