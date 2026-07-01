# apps/accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework import generics, permissions, status, filters
from rest_framework.permissions import IsAdminUser
from .serializers import UserManagementSerializer

from .models import CustomUser
from .serializers import RegistrationSerializer, UserListSerializer, ChangePasswordSerializer, CustomerSerializer
from apps.accounts.services import change_password

from .permissions import CustomerPermission
from django_filters.rest_framework import DjangoFilterBackend


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
        

class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [CustomerPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['first_name', 'last_name', 'date_joined']
    ordering = ['first_name', 'last_name']

    def get_queryset(self):
        return CustomUser.objects.filter(role='customer')


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    # No DELETE: SaleOrder.customer is on_delete=PROTECT, so a real delete
    # would 500 once a customer has any orders. "is_active" toggle via PATCH
    # is the supported way to retire a customer record.
    serializer_class = CustomerSerializer
    permission_classes = [CustomerPermission]

    def get_queryset(self):
        return CustomUser.objects.filter(role='customer')


class UserManagementView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/v1/accounts/<id>/
 
    Admin-only endpoint for Tier 4 "User management" page:
      - change a user's role
      - toggle is_active
 
    Distinct from CustomerListCreateView/CustomerDetailView, which only ever
    touch role='customer' accounts. This endpoint operates on ANY CustomUser
    (admin, manager, staff, customer) and is the only place role/is_active
    can be changed for non-customer accounts.
 
    No DELETE here either — same PROTECT-FK reasoning as customers
    (orders.created_by, stock_transactions.performed_by, etc. all PROTECT
    against the user FK). Deactivate via is_active, never hard-delete.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
 
    def get_object(self):
        obj = super().get_object()
        # Guard rail: an admin can't lock themselves out by demoting/deactivating
        # their own account through this endpoint. Force them to use another
        # admin account for that — avoids a support-ticket footgun.
        if self.request.method in ("PUT", "PATCH") and obj.pk == self.request.user.pk:
            raise PermissionDenied(
                "You cannot change your own role or active status here. "
                "Ask another admin to make this change."
            )
        return obj
