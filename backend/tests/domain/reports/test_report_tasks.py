# tests/domain/reports/test_report_tasks.py
import pytest
from apps.inventory.models import Product, Category
from apps.reports.tasks import generate_inventory_report


@pytest.mark.django_db
def test_generate_inventory_report_low_stock():
    category = Category.objects.create(
        name="Office Equipment",
        description="Printers, scanners, and copiers",
    )

    # quantity=2, reorder_level=5 → 2 <= 5 → IS low stock
    Product.objects.create(
        name="Printer",
        sku="PR001",
        quantity=2,
        price=200,
        category=category,
        status="active",
        reorder_level=5,
    )

    report = generate_inventory_report()
    assert report["total_products"] == 1
    # FIX: task now uses quantity__lte=F('reorder_level') instead of
    # quantity__lt=5. With reorder_level=5 and quantity=2: 2 <= 5 → low stock.
    assert report["low_stock"] == 1


@pytest.mark.django_db
def test_generate_inventory_report_not_low_stock():
    category = Category.objects.create(name="Hardware")

    # quantity=10, reorder_level=5 → 10 > 5 → NOT low stock
    Product.objects.create(
        name="Cable",
        sku="CB001",
        quantity=10,
        price=5,
        category=category,
        status="active",
        reorder_level=5,
    )

    report = generate_inventory_report()
    assert report["total_products"] == 1
    assert report["low_stock"] == 0


@pytest.mark.django_db
def test_generate_inventory_report_at_reorder_boundary():
    category = Category.objects.create(name="Accessories")

    # quantity == reorder_level exactly → still low stock (lte)
    Product.objects.create(
        name="Mouse",
        sku="MS001",
        quantity=5,
        price=15,
        category=category,
        status="active",
        reorder_level=5,
    )

    report = generate_inventory_report()
    assert report["low_stock"] == 1


@pytest.mark.django_db
def test_generate_inventory_report_empty():
    report = generate_inventory_report()
    assert report["total_products"] == 0
    assert report["low_stock"] == 0