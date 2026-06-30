import pytest
from apps.reports.models import LowStockAlert
from apps.inventory.models import Product, Category
from apps.warehouses.models import Warehouse
from apps.orders.models import SaleOrder, SaleOrderItem


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


@pytest.mark.django_db
def test_low_stock_alert_refreshes_on_repeated_ship(staff_user, customer):
    category = Category.objects.create(name="Tools")
    warehouse = Warehouse.objects.create(
        name="Refresh WH", code="RWH01", email="rwh01@example.com"
    )
    product = Product.objects.create(
        name="Drill", sku="DRL001", price=50, quantity=10, reorder_level=5,
        category=category,
    )

    # First ship: drops product to 4 (<= reorder_level 5) → alert created
    order1 = SaleOrder.objects.create(
        customer=customer, warehouse=warehouse, status="confirmed",
        created_by=staff_user,
    )
    SaleOrderItem.objects.create(order=order1, product=product, quantity=6, unit_price=50)
    order1.ship()

    alert = LowStockAlert.objects.get(product=product, warehouse=warehouse)
    assert alert.quantity == 4

    # Second ship: drops product further to 2 → alert should UPDATE, not stay at 4
    order2 = SaleOrder.objects.create(
        customer=customer, warehouse=warehouse, status="confirmed",
        created_by=staff_user,
    )
    SaleOrderItem.objects.create(order=order2, product=product, quantity=2, unit_price=50)
    order2.ship()

    alert.refresh_from_db()
    assert alert.quantity == 2
    # Still only ONE alert row for this product/warehouse pair
    assert LowStockAlert.objects.filter(product=product, warehouse=warehouse).count() == 1
