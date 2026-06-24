# apps/accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics, permissions, status

from .models import CustomUser
from .serializers import RegistrationSerializer, UserListSerializer, ChangePasswordSerializer
from apps.accounts.services import change_password


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]


class AccountsView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    # FIX: Was using RegistrationSerializer (a write serializer) for a read
    # endpoint. Replaced with UserListSerializer which only exposes safe fields
    # and is semantically correct for a GET list response.
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAdminUser]


class ProfileView(generics.RetrieveAPIView):
    # FIX: Profile view now uses UserListSerializer for reads too.
    # RegistrationSerializer was designed for writes; using it here exposed
    # password/password2 fields (write_only=True hides them in output, but
    # it's semantically wrong and confusing for anyone reading the code).
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    # FIX: Removed @transaction.atomic. The change_password service does a
    # single user.save() — there is no multi-step write and no rollback
    # scenario. Wrapping a single-row update in an atomic block adds overhead
    # and misleads readers into thinking a complex transaction is happening.
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