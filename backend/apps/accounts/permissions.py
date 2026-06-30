# apps/accounts/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS


class CustomerPermission(BasePermission):
    """
    Any authenticated user (staff taking an order, managers, admins) can
    list and create customers — this is needed so staff can quick-add a
    customer directly from the Sale Order form.

    Editing or deactivating an existing customer record is restricted to
    admin/manager, since it touches data other staff may be relying on.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS or request.method == "POST":
            return True
        return getattr(request.user, "role", None) in ("admin", "manager")