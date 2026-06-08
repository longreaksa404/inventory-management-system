# apps/warehouses/models.py
from django.db import models


class Warehouse(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True)
    location = models.CharField(max_length=255, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(unique=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    # FIX: missing __str__ caused Django admin and serializer string fields to
    # show "Warehouse object (1)" instead of the warehouse name.
    def __str__(self):
        return self.name