import pytest
from django.core import mail
from django.db import transaction
from apps.reports.models import LowStockAlert
from apps.inventory.models import Product, Category
from apps.warehouses.models import Warehouse


@pytest.mark.django_db
def test_celery_runs_after_commit():
    category = Category.objects.create(name="Default Category")
    warehouse = Warehouse.objects.create(name="Main Warehouse", location="Phnom Penh")

    product = Product.objects.create(
        name="Firewall",
        sku="FW001",
        quantity=2,
        price=300,
        category=category
    )

    with transaction.atomic():
        LowStockAlert.objects.create(
            product=product,
            warehouse=warehouse,
            quantity=product.quantity,
            reorder_level=5
        )
        assert len(mail.outbox) == 1

    assert len(mail.outbox) == 1
