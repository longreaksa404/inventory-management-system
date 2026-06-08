# tests/conftest.py
import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.accounts.models import CustomUser
from apps.inventory.models import Category, Product, StockTransaction
from apps.warehouses.models import Warehouse
from apps.suppliers.models import Supplier
from apps.orders.models import PurchaseOrder, PurchaseOrderItem, SaleOrder, SaleOrderItem

User = get_user_model()

# ---------------------------------------------------------------------------
# User fixtures
# NOTE: Role values must be lowercase to match CustomUser.ROLE_CHOICES:
#   ('admin', 'Admin'), ('manager', 'Manager'), ('staff', 'Staff'), ('customer', 'Customer')
# Phone numbers must match the +855xxxxxxxx validator regex.
# ---------------------------------------------------------------------------

@pytest.fixture
def admin_user(db):
    return CustomUser.objects.create(
        username="admin",
        email="admin@example.com",
        password=make_password("adminadmin"),
        first_name="Admin",
        last_name="User",
        # FIX: valid +855 format required by phone_validator regex
        phone_number="+85512345678",
        # FIX: lowercase to match ROLE_CHOICES
        role="admin",
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def manager_user(db):
    return CustomUser.objects.create(
        username="manager",
        email="manager@example.com",
        password=make_password("password123"),
        first_name="Manager",
        last_name="User",
        phone_number="+85512345679",
        role="manager",  # FIX: lowercase
        is_staff=True,
    )


@pytest.fixture
def staff_user(db):
    return CustomUser.objects.create(
        username="staff",
        email="staff@example.com",
        password=make_password("password123"),
        first_name="Staff",
        last_name="User",
        phone_number="+85512345680",
        role="staff",  # FIX: lowercase
        is_staff=False,
    )


@pytest.fixture
def normal_user(db):
    return CustomUser.objects.create(
        username="user",
        email="user@example.com",
        first_name="Test",
        last_name="User",
        phone_number="+85512345681",
        password=make_password("password123"),
        role="staff",
    )


# FIX: Customer was referencing a non-existent Customer model.
# In this system, customers are CustomUser instances with role="customer".
@pytest.fixture
def customer(db):
    return CustomUser.objects.create(
        username="customer",
        email="customer@example.com",
        first_name="John",
        last_name="Doe",
        phone_number="+85512345682",
        password=make_password("password123"),
        role="customer",
        is_staff=False,
    )


# ---------------------------------------------------------------------------
# Inventory fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    return Category.objects.create(
        name="Electronics",
        description="Electronic gadgets and devices",
    )


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        name="Laptop",
        sku="LAP123",
        price=1000,
        quantity=10,
        status="active",
        category=category,
    )


@pytest.fixture
def stock_transaction_in(db, product, admin_user, warehouse):
    return StockTransaction.objects.create(
        product=product,
        warehouse=warehouse,
        transaction_type="IN",
        quantity=5,
        performed_by=admin_user,
        notes="Initial stock",
    )


# ---------------------------------------------------------------------------
# Warehouse fixture
# FIX: Warehouse.email is required and unique; Warehouse.code is required and unique.
# Previous fixture omitted both, causing IntegrityError on save.
# ---------------------------------------------------------------------------

@pytest.fixture
def warehouse(db):
    return Warehouse.objects.create(
        name="Main Warehouse",
        code="WH001",                        # FIX: required unique field
        location="Phnom Penh",
        email="warehouse@example.com",        # FIX: required unique field
    )


# ---------------------------------------------------------------------------
# Supplier fixture
# FIX: contact_name is required and unique in the Supplier model.
# ---------------------------------------------------------------------------

@pytest.fixture
def supplier(db):
    return Supplier.objects.create(
        name="Tech Supplier",
        contact_name="Supplier Contact",      # FIX: required field was missing
        email="supplier@example.com",
        phone="+85512345683",
        address="Phnom Penh",
    )


# ---------------------------------------------------------------------------
# Order fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def purchase_order(db, supplier, admin_user, warehouse):
    return PurchaseOrder.objects.create(
        supplier=supplier,
        warehouse=warehouse,
        expected_date="2026-01-01",
        status="PENDING",
        created_by=admin_user,
    )


@pytest.fixture
def purchase_order_item(db, purchase_order, product):
    return PurchaseOrderItem.objects.create(
        order=purchase_order,
        product=product,
        quantity=5,
        unit_price=product.price,
    )


@pytest.fixture
def sales_order(db, staff_user, customer, warehouse):
    # FIX: customer fixture now returns a real CustomUser with role="customer"
    return SaleOrder.objects.create(
        customer=customer,
        warehouse=warehouse,
        order_date="2026-01-01",
        status="PENDING",
        created_by=staff_user,
    )


@pytest.fixture
def sales_order_item(db, sales_order, product):
    return SaleOrderItem.objects.create(
        order=sales_order,
        product=product,
        quantity=2,
        unit_price=product.price,
    )


# ---------------------------------------------------------------------------
# API client fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def login_api_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client