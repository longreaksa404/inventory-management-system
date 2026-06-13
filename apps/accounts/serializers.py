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