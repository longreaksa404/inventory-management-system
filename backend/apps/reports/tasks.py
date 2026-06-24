# apps/reports/tasks.py
from celery import shared_task
from django.db.models import F
from apps.inventory.models import Product


@shared_task
def generate_inventory_report():
    """
    Generate a snapshot of current inventory health.

    FIX: Previously used a hardcoded threshold of quantity < 5 for "low stock",
    which ignored the per-product reorder_level field entirely. A product with
    quantity=3 and reorder_level=1 is not low stock — it only becomes low stock
    when quantity <= reorder_level. Using F() lets Django compare two columns
    in a single query without pulling all products into Python.
    """
    return {
        "total_products": Product.objects.count(),
        "low_stock": Product.objects.filter(
            quantity__lte=F('reorder_level')
        ).count(),
    }