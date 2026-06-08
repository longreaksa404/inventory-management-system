# tests/domain/orders/test_purchase_order.py
import pytest
from apps.orders.models import PurchaseOrder


@pytest.mark.django_db
def test_purchase_order_line_total(purchase_order, purchase_order_item):
    # FIX: PurchaseOrder has no total_amount database field.
    # The old test set it as a Python attribute, called save(), then refresh_from_db()
    # which wiped the attribute — asserting on a field that no longer existed.
    # Correct approach: use the line_total() method on the item.
    expected = purchase_order_item.quantity * purchase_order_item.unit_price
    assert purchase_order_item.line_total() == expected
    assert purchase_order_item.line_total() == 5000


@pytest.mark.django_db
def test_purchase_order_status_default(purchase_order):
    assert purchase_order.status in ("PENDING", "draft", "confirmed")


@pytest.mark.django_db
def test_purchase_order_has_items(purchase_order, purchase_order_item):
    assert purchase_order.items.count() == 1
    assert purchase_order.items.first().product is not None