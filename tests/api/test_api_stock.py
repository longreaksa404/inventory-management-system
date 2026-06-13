# tests/api/test_api_stock.py
import pytest


@pytest.mark.django_db
def test_admin_can_create_product(api_client, admin_user, category):
    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        "/api/v1/inventory/products/",
        {
            "name": "Test Product",
            "sku": "TESTSKU",
            "price": "1000.00",
            "quantity": 0,
            "category": category.id,
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["name"] == "Test Product"


@pytest.mark.django_db
def test_normal_user_cannot_create_product(api_client, normal_user):
    api_client.force_authenticate(user=normal_user)

    response = api_client.post(
        "/api/v1/inventory/products/",
        {"name": "Mouse", "sku": "MS001"},
        format="json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_stock_in_api(product, api_client, admin_user, warehouse):
    api_client.force_authenticate(user=admin_user)

    # FIX: Pass warehouse so the audit StockTransaction is created correctly.
    # Without warehouse the model method still updates quantity but silently
    # skips creating the audit trail record.
    response = api_client.post(
        f"/api/v1/inventory/products/{product.id}/stock/in/",
        {"quantity": 10, "warehouse": warehouse.id},
        format="json",
    )

    assert response.status_code == 200
    # product starts at quantity=10, +10 = 20
    assert response.data["stock"] == 20


@pytest.mark.django_db
def test_stock_out_api(product, api_client, admin_user, warehouse):
    api_client.force_authenticate(user=admin_user)

    # FIX: The old test silently increased stock by 20 via the API first,
    # making the starting state unclear. Now we explicitly document:
    # Start: 10 (from fixture) → add 20 → 30 → deduct 5 → 25.
    api_client.post(
        f"/api/v1/inventory/products/{product.id}/stock/in/",
        {"quantity": 20, "warehouse": warehouse.id},
        format="json",
    )

    response = api_client.post(
        f"/api/v1/inventory/products/{product.id}/stock/out/",
        {"quantity": 5, "warehouse": warehouse.id},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["stock"] == 25  # 10 + 20 - 5


@pytest.mark.django_db
def test_stock_out_more_than_available(product, api_client, admin_user, warehouse):
    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        f"/api/v1/inventory/products/{product.id}/stock/out/",
        {"quantity": product.quantity + 5, "warehouse": warehouse.id},
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_adjust_stock_api(product, api_client, admin_user, warehouse):
    api_client.force_authenticate(user=admin_user)

    # FIX: Pass warehouse so the audit StockTransaction is created.
    response = api_client.post(
        f"/api/v1/inventory/products/{product.id}/stock/adjust/",
        {"quantity": 5, "reason": "Inventory audit", "warehouse": warehouse.id},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["stock"] == 5


@pytest.mark.django_db
def test_non_admin_adjust_stock_forbidden(product, api_client, normal_user, warehouse):
    api_client.force_authenticate(user=normal_user)

    response = api_client.post(
        f"/api/v1/inventory/products/{product.id}/stock/adjust/",
        {"quantity": 5, "reason": "Hack", "warehouse": warehouse.id},
        format="json",
    )

    assert response.status_code == 403