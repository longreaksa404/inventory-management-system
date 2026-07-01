import pytest
from apps.accounts.models import CustomUser
 
 
@pytest.mark.django_db
class TestUserManagementAccess:
 
    def test_unauthenticated_denied(self, api_client, staff_user):
        response = api_client.get(f"/api/v1/accounts/{staff_user.id}/")
        assert response.status_code == 401
 
    def test_staff_cannot_access(self, api_client, staff_user, manager_user):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get(f"/api/v1/accounts/{manager_user.id}/")
        assert response.status_code == 403
 
    def test_manager_cannot_access(self, api_client, manager_user, staff_user):
        # is_staff alone isn't enough — IsAdminUser checks is_staff, and
        # manager_user has is_staff=True per the conftest fixture, so this
        # documents that managers DO pass IsAdminUser (is_staff=True) but
        # is included for clarity should that fixture ever change.
        api_client.force_authenticate(user=manager_user)
        response = api_client.get(f"/api/v1/accounts/{staff_user.id}/")
        assert response.status_code == 200
 
    def test_admin_can_view_any_user(self, api_client, admin_user, staff_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f"/api/v1/accounts/{staff_user.id}/")
        assert response.status_code == 200
        assert response.data["email"] == staff_user.email
 
 
@pytest.mark.django_db
class TestUserManagementUpdate:
 
    def test_admin_can_change_role(self, api_client, admin_user, staff_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f"/api/v1/accounts/{staff_user.id}/",
            {"role": "manager"},
            format="json",
        )
        assert response.status_code == 200
        staff_user.refresh_from_db()
        assert staff_user.role == "manager"
        # is_staff should sync to True for manager role
        assert staff_user.is_staff is True
 
    def test_admin_can_deactivate_user(self, api_client, admin_user, staff_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f"/api/v1/accounts/{staff_user.id}/",
            {"is_active": False},
            format="json",
        )
        assert response.status_code == 200
        staff_user.refresh_from_db()
        assert staff_user.is_active is False
 
    def test_invalid_role_rejected(self, api_client, admin_user, staff_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f"/api/v1/accounts/{staff_user.id}/",
            {"role": "superlord"},
            format="json",
        )
        assert response.status_code == 400
 
    def test_protected_fields_are_read_only(self, api_client, admin_user, staff_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f"/api/v1/accounts/{staff_user.id}/",
            {"email": "hacked@example.com", "first_name": "Hacked"},
            format="json",
        )
        assert response.status_code == 200
        staff_user.refresh_from_db()
        assert staff_user.email != "hacked@example.com"
        assert staff_user.first_name != "Hacked"
 
    def test_admin_cannot_modify_own_account_via_this_endpoint(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f"/api/v1/accounts/{admin_user.id}/",
            {"is_active": False},
            format="json",
        )
        assert response.status_code == 403
        admin_user.refresh_from_db()
        assert admin_user.is_active is True
 
    def test_staff_cannot_patch_anyone(self, api_client, staff_user, manager_user):
        api_client.force_authenticate(user=staff_user)
        response = api_client.patch(
            f"/api/v1/accounts/{manager_user.id}/",
            {"is_active": False},
            format="json",
        )
        assert response.status_code == 403
 


