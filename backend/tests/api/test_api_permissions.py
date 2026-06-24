import pytest


@pytest.mark.django_db
def test_unauthenticated_access_denied(product, api_client):
    response = api_client.post(
        "/api/v1/inventory/transactions/",
        {"product": product.id, "quantity": 10, "type": "in"},
        format="json"
    )
    assert response.status_code == 401
