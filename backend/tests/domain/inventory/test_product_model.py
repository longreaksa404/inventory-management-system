# tests/domain/inventory/test_product_model.py
import pytest
from apps.inventory.models import Product


@pytest.mark.django_db
def test_create_product(product):
    assert product.name == "Laptop"
    assert product.quantity == 10
    # FIX: Product.save() uppercases the SKU, so "LAP123" stored as "LAP123" ✓
    assert product.sku == "LAP123"


@pytest.mark.django_db
def test_product_quantity_update(product):
    product.quantity += 5
    product.save()
    product.refresh_from_db()
    assert product.quantity == 15


@pytest.mark.django_db
def test_product_sku_unique(category):
    Product.objects.create(
        name="Mouse",
        sku="MOU123",
        price=20,
        quantity=5,
        category=category,
    )

    with pytest.raises(Exception):
        Product.objects.create(
            name="Keyboard",
            sku="MOU123",   # duplicate SKU → IntegrityError
            price=30,
            quantity=5,
            category=category,
        )


@pytest.mark.django_db
def test_sku_is_normalized_on_save(category):
    """
    Product.save() strips whitespace and uppercases the SKU.
    This test documents and verifies that behaviour explicitly
    so it doesn't silently break if save() is ever refactored.
    """
    product = Product.objects.create(
        name="Test Item",
        sku="  lap999 ",   # mixed case + whitespace
        price=10,
        quantity=0,
        category=category,
    )
    assert product.sku == "LAP999"


@pytest.mark.django_db
def test_product_str(product):
    assert str(product) == "Laptop (LAP123)"


@pytest.mark.django_db
def test_product_default_status(category):
    product = Product.objects.create(
        name="Widget",
        sku="WGT001",
        price=5,
        quantity=0,
        category=category,
    )
    assert product.status == "active"