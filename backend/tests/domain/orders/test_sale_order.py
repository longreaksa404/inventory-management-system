# tests/domain/orders/test_sale_order.py
import pytest


@pytest.mark.django_db
def test_sales_order_line_total(sales_order, sales_order_item):
    # FIX: SaleOrder has no total_amount database field.
    # Compute total from items using the line_total() method.
    expected = sales_order_item.quantity * sales_order_item.unit_price
    assert sales_order_item.line_total() == expected
    assert sales_order_item.line_total() == 2000


@pytest.mark.django_db
def test_sales_order_has_items(sales_order, sales_order_item):
    assert sales_order.items.count() == 1


@pytest.mark.django_db
def test_sales_order_customer_is_customer_role(sales_order):
    assert sales_order.customer.role == "customer"