from django.contrib import admin
from .models import Category, Product, StockTransaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'price', 'quantity', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('name', 'sku')
    ordering = ('name',)


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'transaction_type', 'quantity', 'performed_by', 'timestamp')
    list_filter = ('transaction_type', 'warehouse')
    search_fields = ('product__name', 'warehouse__name')
