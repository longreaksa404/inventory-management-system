from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.orders.views import PurchaseOrderViewSet, SalesOrderViewSet

router = DefaultRouter()
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'sales', SalesOrderViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
]
