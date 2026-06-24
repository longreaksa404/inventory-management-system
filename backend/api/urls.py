from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("", health_check),
    path('v1/accounts/', include('apps.accounts.urls')),
    path('v1/inventory/', include('apps.inventory.urls')),
    path('v1/warehouses/', include('apps.warehouses.urls')),
    path('v1/suppliers/', include('apps.suppliers.urls')),
    path('v1/orders/', include('apps.orders.urls')),
    path('v1/reports/', include('apps.reports.urls')),
    path('v1/core/', include('apps.core.urls')),
]
