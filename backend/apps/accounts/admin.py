from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser

    list_display = ("email", "username", "role", "is_staff", "is_superuser")
    list_filter = ("role", "is_staff", "is_superuser")

    # group fields
    fieldsets = (
        (None, {"fields": ("email", "password")}), # login section
        ("Personal info", {"fields": ("username", "first_name", "last_name", "phone_number")}),
        ("Permissions", {"fields": ("role", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",)}),
    )

    # custom field for register new user
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "username",
                "first_name",
                "last_name",
                "phone_number",
                "password1",
                "password2",
                "role",
                "is_staff",
                "is_superuser",
            ),
        }),
    )

    search_fields = ("email", "username")
    ordering = ("email",)
