from django.contrib import admin

from apps.orders.models import PurchaseOrderItem, PurchaseOrder, SaleOrder


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    autocomplete_fields = ('product',)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'supplier', 'warehouse', 'status', 'created_at', 'expected_date')
    list_filter = ('status', 'created_at', 'expected_date')
    search_fields = ('supplier__name', 'notes')
    inlines = [PurchaseOrderItemInline]
    autocomplete_fields = ('supplier', 'warehouse')


@admin.register(PurchaseOrderItem)
class PurchaseOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price')
    search_fields = ('product__name',)
    list_filter = ('order__status',)
