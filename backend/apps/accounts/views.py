# apps/accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework import generics, permissions, status

from .models import CustomUser
from .serializers import RegistrationSerializer, UserListSerializer, ChangePasswordSerializer
from apps.accounts.services import change_password


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]


class AccountsView(generics.ListAPIView):
    """
    GET /api/v1/accounts/?role=customer  -> available to ANY authenticated user
        (needed so staff can populate the customer dropdown on the sale order form)
    GET /api/v1/accounts/                -> full unfiltered list, admin-only
    """
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = CustomUser.objects.all().order_by('first_name', 'last_name')
        role = self.request.query_params.get('role')

        if role:
            return queryset.filter(role=role)

        # No role filter requested — this is the full user list, restrict to admins.
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only admins can list all users. Use ?role= to fetch a filtered list."
            )
        return queryset


class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        try:
            change_password(
                user,
                serializer.validated_data['old_password'],
                serializer.validated_data['new_password'],
            )
            return Response(
                {"detail": "Password changed successfully."},
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )