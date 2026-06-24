# apps/suppliers/models.py
from django.db import models

# FIX: The original file imported Product, StockTransaction (from inventory)
# and Warehouse (from warehouses) — none of which are used in the Supplier
# model itself. These dead imports created unnecessary coupling and risked
# circular import errors as the codebase grows (inventory → suppliers → inventory).


class Supplier(models.Model):
    name = models.CharField(max_length=100, unique=True)
    contact_name = models.CharField(max_length=255, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name', '-created_at']

    def __str__(self):
        return self.name