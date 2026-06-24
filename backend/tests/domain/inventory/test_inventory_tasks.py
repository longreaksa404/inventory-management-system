# tests/domain/inventory/test_inventory_tasks.py
import pytest
from django.core import mail
from apps.inventory.tasks import notify_low_stock
from apps.inventory.models import Product, Category
from unittest.mock import patch


@pytest.mark.django_db
def test_notify_low_stock_sends_email():
    category = Category.objects.create(name="Default Category")
    # FIX: notify_low_stock now uses quantity__lte=F('reorder_level').
    # Previously quantity=3 with default reorder_level=1 meant 3 > 1
    # so the product was NOT low stock, but the old quantity__lt=5 check
    # accidentally caught it. Now we set reorder_level=5 so 3 <= 5 is
    # correctly identified as low stock.
    Product.objects.create(
        name="Keyboard",
        sku="KB001",
        quantity=3,
        price=10,
        category=category,
        reorder_level=5,
    )

    result = notify_low_stock.apply()

    assert result.get().startswith("Low stock notification sent")
    assert len(mail.outbox) == 1
    assert "Keyboard" in mail.outbox[0].body


@pytest.mark.django_db
def test_notify_low_stock_no_products():
    category = Category.objects.create(name="Default Category")
    # quantity=20 > reorder_level=5 → NOT low stock → no email
    Product.objects.create(
        name="Mouse",
        sku="MS001",
        quantity=20,
        price=5,
        category=category,
        reorder_level=5,
    )

    result = notify_low_stock.apply()

    assert result.get() == "No low stock products today."
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_notify_low_stock_at_reorder_boundary():
    category = Category.objects.create(name="Default Category")
    # quantity == reorder_level exactly → still low stock (lte)
    Product.objects.create(
        name="Hub",
        sku="HB001",
        quantity=5,
        price=30,
        category=category,
        reorder_level=5,
    )

    result = notify_low_stock.apply()

    assert result.get().startswith("Low stock notification sent")
    assert len(mail.outbox) == 1


@pytest.mark.django_db
@patch("apps.inventory.tasks.send_mail")
def test_notify_low_stock_retry(mock_send_mail):
    mock_send_mail.side_effect = Exception("SMTP down")

    category = Category.objects.create(name="Default Category")
    Product.objects.create(
        name="Monitor",
        sku="MN001",
        quantity=2,
        price=200,
        category=category,
        reorder_level=5,
    )

    with pytest.raises(Exception):
        notify_low_stock()


@pytest.mark.django_db
@patch("apps.inventory.tasks.send_mail")
def test_notify_low_stock_email_mocked(mock_send_mail):
    category = Category.objects.create(name="Default Category")
    Product.objects.create(
        name="Camera",
        sku="CM001",
        quantity=1,
        price=500,
        category=category,
        reorder_level=5,
    )

    notify_low_stock.apply()

    mock_send_mail.assert_called_once()
    # Verify correct recipients are used (from settings, not hardcoded)
    call_kwargs = mock_send_mail.call_args
    assert "longreak" not in str(call_kwargs)
    assert "gmail.com" not in str(call_kwargs)