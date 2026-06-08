# tests/domain/accounts/test_user_model.py
import pytest


@pytest.mark.django_db
def test_admin_user_role(admin_user):
    # FIX: ROLE_CHOICES uses lowercase values: 'admin', not 'Admin'.
    # The original test asserted role == "Admin" (capitalized) which never
    # matched the stored value and would have failed once full_clean() ran.
    assert admin_user.role == "admin"
    assert admin_user.is_staff
    assert admin_user.is_superuser


@pytest.mark.django_db
def test_staff_user_role(staff_user):
    # FIX: lowercase "staff" to match ROLE_CHOICES
    assert staff_user.role == "staff"
    assert not staff_user.is_superuser


@pytest.mark.django_db
def test_manager_user_role(manager_user):
    assert manager_user.role == "manager"
    assert manager_user.is_staff


@pytest.mark.django_db
def test_customer_user_role(customer):
    assert customer.role == "customer"
    assert not customer.is_staff