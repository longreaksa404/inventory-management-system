# apps/orders/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS


def has_perm(user, perm_codename):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.has_perm(perm_codename)


class SaleOrderPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "orders.view_saleorder")
        if view.action == "create":
            return has_perm(request.user, "orders.add_saleorder")
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "orders.view_saleorder")
        if view.action in ["update", "partial_update", "destroy"]:
            return has_perm(request.user, "orders.change_saleorder")
        if view.action == "confirm":
            return has_perm(request.user, "orders.confirm_sale_order")
        if view.action == "ship":
            return has_perm(request.user, "orders.ship_sale_order")
        if view.action == "invoice":
            return has_perm(request.user, "orders.invoice_sale_order")
        return False


class PurchaseOrderPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "orders.view_purchaseorder")
        if view.action == "create":
            return has_perm(request.user, "orders.add_purchaseorder")
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "orders.view_purchaseorder")
        if view.action in ["update", "partial_update", "destroy"]:
            return has_perm(request.user, "orders.change_purchaseorder")
        # FIX: was "orders.confirm_purchase order" — space in codename is a typo,
        # Django permission codenames never contain spaces.
        if view.action == "confirm":
            return has_perm(request.user, "orders.confirm_purchase_order")
        if view.action == "receive":
            return has_perm(request.user, "orders.receive_purchase_order")
        return False