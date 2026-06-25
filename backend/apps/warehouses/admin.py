from django.contrib import admin

from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'location', 'contact_person', 'phone', 'email', 'created_at')
    search_fields = ('name', 'code', 'location')
    ordering = ('name',)
