from rest_framework import generics, permissions

from apps.inventory.views import SearchFilterOrderingMixin
from .models import Supplier
from .serializers import SupplierSerializer
from apps.suppliers.permissions import SupplierPermission


class SupplierListCreateView(SearchFilterOrderingMixin, generics.ListCreateAPIView):
    # FIX: Was (generics.ListCreateAPIView, SearchFilterOrderingMixin) — wrong MRO.
    # Python resolves attributes left-to-right in the MRO, so the mixin's
    # filter_backends would be shadowed by DRF's class-level default.
    # Mixin must come first so its attributes win.
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = (SupplierPermission,)

    filterset_fields = ['name', 'email']
    search_fields = ['name', 'contact_name', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = (SupplierPermission,)