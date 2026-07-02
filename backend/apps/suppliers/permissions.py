from rest_framework.permissions import BasePermission, SAFE_METHODS


def has_perm(user, perm):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.has_perm(perm)


class SupplierPermission(BasePermission):

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return has_perm(request.user, "suppliers.view_supplier")
        if request.method == "POST":
            return has_perm(request.user, "suppliers.add_supplier")
        if request.method in ["PUT", "PATCH"]:
            return has_perm(request.user, "suppliers.change_supplier")
        if request.method == "DELETE":
            return has_perm(request.user, "suppliers.delete_supplier")
        return False