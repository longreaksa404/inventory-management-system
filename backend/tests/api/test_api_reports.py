# tests/api/test_api_reports.py
import pytest
from apps.inventory.models import Product


@pytest.mark.django_db
def test_low_stock_report_uses_product_quantity(api_client, admin_user, category):
    api_client.force_authenticate(user=admin_user)

    # Below reorder level — should appear
    Product.objects.create(
        name="Low Stock Item", sku="LSI001",
        price=10, quantity=2, reorder_level=5,
        category=category,
    )
    # Above reorder level — should NOT appear
    Product.objects.create(
        name="Well Stocked Item", sku="WSI001",
        price=10, quantity=50, reorder_level=5,
        category=category,
    )
    # Exactly at reorder level — should appear (lte)
    Product.objects.create(
        name="Boundary Item", sku="BND001",
        price=10, quantity=5, reorder_level=5,
        category=category,
    )

    response = api_client.get("/api/v1/reports/low-stock/")

    assert response.status_code == 200
    names = [item["product_name"] for item in response.data]
    assert "Low Stock Item" in names
    assert "Boundary Item" in names
    assert "Well Stocked Item" not in names


@pytest.mark.django_db
def test_low_stock_report_ignores_order_items_entirely(api_client, admin_user, category, supplier, warehouse):
    """
    FIX regression test: previously this endpoint computed stock from
    PurchaseOrderItem/SaleOrderItem sums. A product with zero order items
    but real Product.quantity set via Stock In/Out should now show up
    correctly based on quantity vs reorder_level — not based on order history.
    """
    api_client.force_authenticate(user=admin_user)

    product = Product.objects.create(
        name="Never Ordered", sku="NEV001",
        price=10, quantity=1, reorder_level=10,
        category=category,
    )

    response = api_client.get("/api/v1/reports/low-stock/")

    assert response.status_code == 200
    names = [item["product_name"] for item in response.data]
    assert "Never Ordered" in names


@pytest.mark.django_db
def test_low_stock_report_empty_when_no_products(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    response = api_client.get("/api/v1/reports/low-stock/")
    assert response.status_code == 200
    assert response.data == []