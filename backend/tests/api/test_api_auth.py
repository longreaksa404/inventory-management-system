# tests/api/test_api_auth.py
import pytest
from rest_framework.test import APIClient
from django.urls import reverse


@pytest.mark.django_db
def test_login_success(admin_user):
    client = APIClient()

    response = client.post(
        reverse("token_obtain_pair"),
        {
            "email": admin_user.email,
            "password": "adminadmin",
        },
        format="json",
    )

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


# FIX: Missing @pytest.mark.django_db decorator. The admin_user fixture
# requires DB access to look up the user — without the marker, pytest-django
# blocks the query and raises "database access not allowed here" which
# obscures the actual intent of the test.
@pytest.mark.django_db
def test_login_fail_wrong_password(admin_user):
    client = APIClient()

    response = client.post(
        reverse("token_obtain_pair"),
        {
            "email": admin_user.email,
            "password": "wrongpassword",
        },
        format="json",
    )

    assert response.status_code == 401


@pytest.mark.django_db
def test_login_fail_wrong_email(admin_user):
    client = APIClient()

    response = client.post(
        reverse("token_obtain_pair"),
        {
            "email": "nobody@example.com",
            "password": "adminadmin",
        },
        format="json",
    )

    assert response.status_code == 401


@pytest.mark.django_db
def test_unauthenticated_profile_access_denied():
    client = APIClient()
    response = client.get("/api/v1/accounts/profile/")
    assert response.status_code == 401