# tests/domain/inventory/test_integration.py
import pytest
from django.core import mail
from apps.inventory.models import Product, Category
from apps.reports.models import LowStockAlert
from apps.warehouses.models import Warehouse


@pytest.mark.django_db
def test_low_stock_alert_triggers_email():
    # FIX: Warehouse.code and Warehouse.email are required unique fields.
    # The original test omitted both, causing IntegrityError on save.
    warehouse = Warehouse.objects.create(
        name="Main Warehouse",
        code="WH001",
        email="main@warehouse.com",
        location="Phnom Penh",
    )
    category = Category.objects.create(name="Default Category")
    product = Product.objects.create(
        name="Switch",
        sku="SW001",
        quantity=2,
        price=100,
        category=category,
    )

    # Creating a LowStockAlert triggers the post_save signal in
    # apps/inventory/signals.py which calls send_mail().
    # With EMAIL_BACKEND = locmem in test settings, mail goes to mail.outbox.
    LowStockAlert.objects.create(
        product=product,
        warehouse=warehouse,
        quantity=product.quantity,
        reorder_level=5,
    )

    assert len(mail.outbox) == 1
    assert "Switch" in mail.outbox[0].body