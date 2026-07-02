from rest_framework import generics, permissions

from .models import Warehouse
from .serializers import WarehouseSerializer
from apps.warehouses.permissions import WarehousePermission


class WarehouseListCreateView(generics.ListCreateAPIView):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = (WarehousePermission,)


class WarehouseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = (WarehousePermission,)
