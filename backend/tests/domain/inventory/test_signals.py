# tests/domain/inventory/test_signals.py
import pytest
# FIX: StockReportEntry was deleted from inventory app (migration 0012).
# The authoritative model is in apps.reports.models.
from apps.reports.models import StockReportEntry, LowStockAlert
from apps.inventory.models import Product, Category
from apps.warehouses.models import Warehouse


def make_warehouse(name="Main Warehouse", code="WH001"):
    """Helper to create a warehouse with all required fields."""
    return Warehouse.objects.create(
        name=name,
        # FIX: code and email are required unique fields on Warehouse.
        code=code,
        email=f"{code.lower()}@example.com",
        location="Phnom Penh",
    )


@pytest.mark.django_db
def test_stock_report_entry_created_on_alert():
    warehouse = make_warehouse()
    category = Category.objects.create(name="Default Category")
    product = Product.objects.create(
        name="SSD", sku="SSD001", quantity=2, price=100, category=category
    )

    alert = LowStockAlert.objects.create(
        product=product,
        warehouse=warehouse,
        quantity=product.quantity,
        reorder_level=5,
    )

    entry = StockReportEntry.objects.get(alert=alert)
    assert entry.product_name == "SSD"
    assert entry.quantity == 5


@pytest.mark.django_db
def test_stock_report_entry_not_duplicated():
    warehouse = make_warehouse(name="Secondary Warehouse", code="WH002")
    category = Category.objects.create(name="Default Category 2")
    product = Product.objects.create(
        name="RAM", sku="RAM001", quantity=1, price=50, category=category
    )

    alert = LowStockAlert.objects.create(
        product=product,
        warehouse=warehouse,
        quantity=product.quantity,
        reorder_level=4,
    )

    alert.save()

    assert StockReportEntry.objects.filter(alert=alert).count() == 1


@pytest.mark.django_db
def test_low_stock_full_flow():
    warehouse = make_warehouse(name="Tertiary Warehouse", code="WH003")
    category = Category.objects.create(name="Default Category 3")
    product = Product.objects.create(
        name="HDD", sku="HD001", quantity=2, price=80, category=category
    )

    alert = LowStockAlert.objects.create(
        product=product,
        warehouse=warehouse,
        quantity=product.quantity,
        reorder_level=5,
    )

    report = StockReportEntry.objects.get(alert=alert)
    assert report.product_name == "HDD"