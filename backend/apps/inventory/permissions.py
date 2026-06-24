# apps/inventory/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS


# FIX: The original has_perm() did not short-circuit for is_superuser,
# unlike the identical helper in orders/permissions.py which does.
# In practice Django's ModelBackend makes user.has_perm() return True for
# superusers anyway, but the inconsistency is confusing and becomes a real
# bug if the auth backend is ever changed or extended. Consistent behaviour
# across both permission modules now.
def has_perm(user, perm):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.has_perm(perm)


class CategoryPermission(BasePermission):

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "inventory.view_category")
        if request.method == "POST":
            return has_perm(request.user, "inventory.add_category")
        if request.method in ["PUT", "PATCH"]:
            return has_perm(request.user, "inventory.change_category")
        if request.method == "DELETE":
            return has_perm(request.user, "inventory.delete_category")
        return False


class ProductPermission(BasePermission):

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "inventory.view_product")
        if request.method == "POST":
            return has_perm(request.user, "inventory.add_product")
        if request.method in ["PUT", "PATCH"]:
            return has_perm(request.user, "inventory.change_product")
        if request.method == "DELETE":
            return has_perm(request.user, "inventory.delete_product")
        return False


class StockTransactionPermission(BasePermission):

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return (
                has_perm(request.user, "inventory.view_stocktransaction")
                or has_perm(request.user, "inventory.view_stock_history")
            )
        if request.method == "POST":
            return has_perm(request.user, "inventory.create_stock_transaction")
        # FIX: Previously grouped PUT/PATCH/DELETE all under approve_stock_transaction.
        # DELETE on a stock transaction is a destructive audit-trail operation and
        # should require a more privileged check. Separated here for clarity —
        # modify (PUT/PATCH) vs delete are now distinct permission paths.
        if request.method in ["PUT", "PATCH"]:
            return has_perm(request.user, "inventory.approve_stock_transaction")
        if request.method == "DELETE":
            return has_perm(request.user, "inventory.approve_stock_transaction") \
                   and request.user.is_staff
        return False


class LowStockAlertPermission(BasePermission):

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "inventory.view_low_stock_alert")
        if request.method in ["PUT", "PATCH"]:
            return has_perm(request.user, "inventory.resolve_low_stock_alert")
        return False


class ProductActionPermission(BasePermission):

    def has_permission(self, request, view):
        if view.action == "discontinue":
            return has_perm(request.user, "inventory.discontinue_product")
        if view.action == "adjust_stock":
            return has_perm(request.user, "inventory.adjust_stock")
        return True