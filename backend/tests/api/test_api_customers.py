# tests/api/test_api_customers.py
#
# Coverage for the Customer management endpoints added in Session 15:
#   POST/GET   /api/v1/accounts/customers/
#   GET/PATCH  /api/v1/accounts/customers/<pk>/
#
# Permission model under test (apps/accounts/permissions.py CustomerPermission):
#   - SAFE_METHODS or POST -> any authenticated user
#   - PUT/PATCH/DELETE     -> role in ("admin", "manager") only
#
# Serializer behavior under test (apps/accounts/serializers.py CustomerSerializer):
#   - role is force-set server-side to "customer", never accepted from input
#   - username falls back to email when not explicitly provided
#   - password is never collected (create_user(password=None, ...))

import pytest
from apps.accounts.models import CustomUser


@pytest.mark.django_db
class TestCustomerCreate:

    def test_staff_can_create_customer(self, api_client, staff_user):
        """Any authenticated user — including plain staff — can create a customer.
        This is the entire point of CustomerPermission: staff need to quick-add
        a customer directly from the Sale Order form.
        """
        api_client.force_authenticate(user=staff_user)

        response = api_client.post(
            "/api/v1/accounts/customers/",
            {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane.doe@example.com",
                "phone_number": "+85512345699",
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["first_name"] == "Jane"
        assert response.data["email"] == "jane.doe@example.com"

        created = CustomUser.objects.get(email="jane.doe@example.com")
        assert created.role == "customer"

    def test_admin_can_create_customer(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)

        response = api_client.post(
            "/api/v1/accounts/customers/",
            {
                "first_name": "Mark",
                "last_name": "Lee",
                "email": "mark.lee@example.com",
            },
            format="json",
        )

        assert response.status_code == 201

    def test_unauthenticated_cannot_create_customer(self, api_client):
        response = api_client.post(
            "/api/v1/accounts/customers/",
            {
                "first_name": "No",
                "last_name": "Auth",
                "email": "noauth@example.com",
            },
            format="json",
        )

        assert response.status_code == 401

    def test_role_cannot_be_overridden_from_input(self, api_client, staff_user):
        """Even if a caller tries to slip a role through, CustomerSerializer.create()
        force-sets role='customer' server-side — this must not be overridable.
        """
        api_client.force_authenticate(user=staff_user)

        response = api_client.post(
            "/api/v1/accounts/customers/",
            {
                "first_name": "Sneaky",
                "last_name": "User",
                "email": "sneaky@example.com",
                "role": "admin",
            },
            format="json",
        )

        assert response.status_code == 201
        created = CustomUser.objects.get(email="sneaky@example.com")
        assert created.role == "customer"
        assert created.is_staff is False

    def test_username_falls_back_to_email_when_not_provided(self, api_client, staff_user):
        api_client.force_authenticate(user=staff_user)

        response = api_client.post(
            "/api/v1/accounts/customers/",
            {
                "first_name": "Sam",
                "last_name": "Smith",
                "email": "sam.smith@example.com",
                # username intentionally omitted
            },
            format="json",
        )

        assert response.status_code == 201
        created = CustomUser.objects.get(email="sam.smith@example.com")
        assert created.username == "sam.smith@example.com"

    def test_username_explicit_value_is_respected(self, api_client, staff_user):
        api_client.force_authenticate(user=staff_user)

        response = api_client.post(
            "/api/v1/accounts/customers/",
            {
                "first_name": "Sam",
                "last_name": "Smith",
                "email": "sam2.smith@example.com",
                "username": "sam_custom_handle",
            },
            format="json",
        )

        assert response.status_code == 201
        created = CustomUser.objects.get(email="sam2.smith@example.com")
        assert created.username == "sam_custom_handle"

    def test_created_customer_has_unusable_password(self, api_client, staff_user):
        """Customers created via this flow never log in — create_user(password=None, ...)
        should leave them with an unusable password, not a blank/guessable one.
        """
        api_client.force_authenticate(user=staff_user)

        api_client.post(
            "/api/v1/accounts/customers/",
            {
                "first_name": "NoLogin",
                "last_name": "Customer",
                "email": "nologin@example.com",
            },
            format="json",
        )

        created = CustomUser.objects.get(email="nologin@example.com")
        assert not created.has_usable_password()


@pytest.mark.django_db
class TestCustomerList:

    def test_list_requires_authentication(self, api_client):
        response = api_client.get("/api/v1/accounts/customers/")
        assert response.status_code == 401

    def test_staff_can_list_customers(self, api_client, staff_user, customer):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get("/api/v1/accounts/customers/")
        assert response.status_code == 200
        emails = [c["email"] for c in response.data["results"]]
        assert customer.email in emails

    def test_list_only_returns_customer_role_users(self, api_client, staff_user, customer, admin_user):
        """The queryset filters role='customer' — staff/admin/manager accounts
        must never leak into this endpoint regardless of who's asking.
        """
        api_client.force_authenticate(user=staff_user)
        response = api_client.get("/api/v1/accounts/customers/")
        emails = [c["email"] for c in response.data["results"]]
        assert customer.email in emails
        assert admin_user.email not in emails
        assert staff_user.email not in emails

    def test_search_by_name(self, api_client, staff_user, customer):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get(
            "/api/v1/accounts/customers/", {"search": customer.first_name}
        )
        assert response.status_code == 200
        emails = [c["email"] for c in response.data["results"]]
        assert customer.email in emails

    def test_search_no_match_returns_empty(self, api_client, staff_user, customer):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get(
            "/api/v1/accounts/customers/", {"search": "no_such_customer_xyz"}
        )
        assert response.status_code == 200
        assert response.data["results"] == []


@pytest.mark.django_db
class TestCustomerUpdate:

    def test_staff_cannot_patch_customer(self, api_client, staff_user, customer):
        api_client.force_authenticate(user=staff_user)

        response = api_client.patch(
            f"/api/v1/accounts/customers/{customer.id}/",
            {"first_name": "Changed"},
            format="json",
        )

        assert response.status_code == 403
        customer.refresh_from_db()
        assert customer.first_name != "Changed"

    def test_admin_can_patch_customer(self, api_client, admin_user, customer):
        api_client.force_authenticate(user=admin_user)

        response = api_client.patch(
            f"/api/v1/accounts/customers/{customer.id}/",
            {"first_name": "UpdatedByAdmin"},
            format="json",
        )

        assert response.status_code == 200
        customer.refresh_from_db()
        assert customer.first_name == "UpdatedByAdmin"

    def test_manager_can_patch_customer(self, api_client, manager_user, customer):
        api_client.force_authenticate(user=manager_user)

        response = api_client.patch(
            f"/api/v1/accounts/customers/{customer.id}/",
            {"last_name": "UpdatedByManager"},
            format="json",
        )

        assert response.status_code == 200
        customer.refresh_from_db()
        assert customer.last_name == "UpdatedByManager"

    def test_admin_can_deactivate_customer(self, api_client, admin_user, customer):
        """Soft-deactivate pattern — SaleOrder.customer is on_delete=PROTECT,
        so is_active toggle via PATCH is the supported retirement path, not DELETE.
        """
        api_client.force_authenticate(user=admin_user)
        assert customer.is_active is True

        response = api_client.patch(
            f"/api/v1/accounts/customers/{customer.id}/",
            {"is_active": False},
            format="json",
        )

        assert response.status_code == 200
        customer.refresh_from_db()
        assert customer.is_active is False

    def test_admin_can_reactivate_customer(self, api_client, admin_user, customer):
        customer.is_active = False
        customer.save()

        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f"/api/v1/accounts/customers/{customer.id}/",
            {"is_active": True},
            format="json",
        )

        assert response.status_code == 200
        customer.refresh_from_db()
        assert customer.is_active is True

    def test_unauthenticated_cannot_patch_customer(self, api_client, customer):
        response = api_client.patch(
            f"/api/v1/accounts/customers/{customer.id}/",
            {"first_name": "Nope"},
            format="json",
        )
        assert response.status_code == 401

    def test_no_delete_endpoint_exposed(self, api_client, admin_user, customer):
        """Deliberately no DELETE — SaleOrder.customer is PROTECT, so a hard
        delete would 500 once a customer has orders. There should be no route
        wired up for it at all (404/405), not a permission error.
        """
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f"/api/v1/accounts/customers/{customer.id}/")
        assert response.status_code in (404, 405)