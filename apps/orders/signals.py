# apps/orders/signals.py
#
# IMPORTANT: Stock mutation is handled exclusively inside the model methods:
#   - PurchaseOrder.receive()  → adds stock per item
#   - SaleOrder.ship()         → deducts stock per item
#
# The old signal handlers below were causing DOUBLE stock changes.
# They have been removed. Do NOT re-add stock logic here.

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PurchaseOrder, SaleOrder
from apps.reports.signals import (  # noqa: F401 – keep report signals wired
    create_sales_report_entry,
    create_purchase_report_entry,
)