from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.serializers import RegistrationSerializer
from apps.accounts.views import (
    RegisterView, ProfileView, AccountsView, ChangePasswordView,
    CustomerListCreateView, CustomerDetailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', AccountsView.as_view(), name='accounts'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('customers/', CustomerListCreateView.as_view(), name='customer-list-create'),
    path('customers/<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
]
