# apps/accounts/serializers.py
from rest_framework import serializers
from .models import CustomUser


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        style={'input_type': 'password'}, write_only=True, min_length=8
    )
    password2 = serializers.CharField(
        style={'input_type': 'password'}, write_only=True, min_length=8
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'username', 'phone_number', 'role', 'is_staff',
            'password', 'password2',
        ]
        # FIX: is_staff and role were writable, meaning any anonymous user
        # hitting POST /register/ could pass {"is_staff": true, "role": "admin"}
        # and grant themselves elevated privileges. Both are now read-only —
        # role defaults to 'staff' in create(), is_staff is set by admins only.
        read_only_fields = ['id', 'is_staff', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Passwords must match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # Enforce safe default role — even if role somehow arrived in
        # validated_data (e.g. via a future serializer change), it's overridden.
        validated_data['role'] = 'staff'
        return CustomUser.objects.create_user(**validated_data)


class UserListSerializer(serializers.ModelSerializer):
    """
    FIX: AccountsView previously reused RegistrationSerializer for listing
    users (GET), which is the wrong serializer for reads — it's designed for
    writes and includes password fields (write_only=True hides them but it's
    still semantically wrong and fragile). This dedicated read serializer
    only exposes safe, relevant fields.
    """
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'role', 'is_staff', 'date_joined',
        ]
        read_only_fields = fields


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, min_length=1)
    new_password = serializers.CharField(required=True, min_length=8)


class CustomerSerializer(serializers.ModelSerializer):
    """
    Dedicated serializer for customer records (CustomUser with role="customer").
    Separate from RegistrationSerializer on purpose: customers don't log in
    through this system, so no password is collected here, and role is
    force-set server-side rather than read from input — same security
    reasoning as RegistrationSerializer's read_only role/is_staff fields.
    """
    class Meta:
        model = CustomUser
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'phone_number', 'username', 'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'username': {'required': False},
        }

    def create(self, validated_data):
        validated_data['role'] = 'customer'
        # Customers aren't issued credentials through this flow — username
        # falls back to email if not explicitly provided, and create_user's
        # set_password(None) gives them an unusable password (can't log in,
        # which is correct: they're a record, not an account holder here).
        validated_data.setdefault('username', validated_data['email'])
        return CustomUser.objects.create_user(password=None, **validated_data)
    

class UserManagementSerializer(serializers.ModelSerializer):
    """
    Admin-only read/write serializer for UserManagementView.

    role and is_active are writable here — this is the one place in the
    whole app where that's true for non-customer accounts. Everything else
    (first/last name, email, username, phone) stays read-only: this page is
    for role/active management, not profile editing.
    """
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'role', 'is_staff', 'is_active', 'date_joined',
        ]
        read_only_fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'date_joined',
        ]

    def validate_role(self, value):
        valid_roles = dict(CustomUser.ROLE_CHOICES)
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role: {value}")
        return value

    def update(self, instance, validated_data):
        # Keep is_staff in sync with role: admin/manager get staff (Django
        # admin) access, staff/customer don't. Mirrors the convention already
        # used in conftest.py fixtures and CustomUserManager.create_superuser.
        role = validated_data.get('role', instance.role)
        if 'role' in validated_data:
            validated_data['is_staff'] = role in ('admin', 'manager')
        return super().update(instance, validated_data)