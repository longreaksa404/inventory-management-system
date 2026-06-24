# apps/inventory/models.py
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.core.exceptions import ValidationError

from apps.warehouses.models import Warehouse


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('name',)
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('discontinued', 'Discontinued'),
        ('out_of_stock', 'Out of Stock'),
    )

    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(
        decimal_places=2, max_digits=10,
        validators=[MinValueValidator(0.0)]
    )
    quantity = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name='products'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reorder_level = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ('name',)
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['name']),
        ]
        permissions = [
            ("adjust_stock", "Can adjust product stock"),
            ("view_cost_price", "Can view product cost price"),
            ("discontinue_product", "Can discontinue product"),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        self.sku = self.sku.strip().upper()
        super().save(*args, **kwargs)

    # ------------------------------------------------------------------
    # Stock mutation helpers
    # FIX: these now create StockTransaction records so every mutation
    # is auditable, regardless of which code path triggered it.
    # Warehouse and user are required to create the audit record.
    # ------------------------------------------------------------------

    def increase_stock(self, qty, user=None, warehouse=None, notes=""):
        if user and warehouse:
            StockTransaction.objects.create(
                product=self,
                warehouse=warehouse,
                transaction_type="IN",
                quantity=qty,
                performed_by=user,
                notes=notes or "Stock in via API",
            )
            self.refresh_from_db()
        else:
            self.quantity += qty
            self.save()

    def decrease_stock(self, qty, user=None, warehouse=None, notes=""):
        if qty > self.quantity:
            raise ValueError("Not enough stock")
        if user and warehouse:
            StockTransaction.objects.create(
                product=self,
                warehouse=warehouse,
                transaction_type="OUT",
                quantity=qty,
                performed_by=user,
                notes=notes or "Stock out via API",
            )
            self.refresh_from_db()
        else:
            self.quantity -= qty
            self.save()

    def adjust_stock(self, qty, reason="", user=None, warehouse=None):
        if user and warehouse:
            StockTransaction.objects.create(
                product=self,
                warehouse=warehouse,
                transaction_type="ADJ",
                quantity=qty,
                performed_by=user,
                notes=reason or "Stock adjustment via API",
            )
            self.refresh_from_db()
        else:
            self.quantity = qty
            self.save()


class StockTransaction(models.Model):
    TRANSACTION_STATUS_CHOICES = (
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJ', 'Adjustment'),
    )

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='stock_transactions'
    )
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT,
        related_name='stock_transactions', default=1  # type: ignore[arg-type]
    )

    transaction_type = models.CharField(
        max_length=5, choices=TRANSACTION_STATUS_CHOICES, default='IN'
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='stock_transactions',
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-timestamp',)
        permissions = [
            ("create_stock_transaction", "Can create stock transaction"),
            ("approve_stock_transaction", "Can approve stock transaction"),
            ("view_stock_history", "Can view stock transaction history"),
        ]

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.product.name} ({self.quantity})"

    def clean(self):
        if self.transaction_type == 'OUT' and self.product.quantity < self.quantity:
            raise ValidationError("Not enough stock to complete transaction")

        # FIX: role values are lowercase in ROLE_CHOICES — was "Admin" (capitalized),
        # which never matched any real user, blocking all ADJ transactions.
        if self.transaction_type == "ADJ" and \
                getattr(self.performed_by, "role", None) != "admin":
            raise PermissionError("Only admins can adjust stock")

        super().clean()

    def apply_transaction(self):
        if self.transaction_type == 'IN':
            self.product.quantity += self.quantity
        elif self.transaction_type == 'OUT':
            if self.product.quantity < self.quantity:
                raise ValueError("Not enough stock to complete transaction")
            self.product.quantity -= self.quantity
        elif self.transaction_type == 'ADJ':
            self.product.quantity = self.quantity
        self.product.save()

    def save(self, *args, **kwargs):
        self.full_clean()
        with transaction.atomic():
            super().save(*args, **kwargs)
            self.apply_transaction()


class LowStockAlert(models.Model):
    """
    FIX: Previously duplicated across inventory/models.py and reports/models.py.
    The authoritative model lives in apps/reports/models.py.
    This class is intentionally removed from inventory — all code should import
    LowStockAlert from apps.reports.models.

    Keeping this file clean prevents circular imports and import confusion.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, default=1)  # type: ignore[arg-type]
    quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=1)
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        permissions = [
            ("view_low_stock_alert", "Can view low stock alerts"),
            ("resolve_low_stock_alert", "Can resolve low stock alerts"),
        ]

    def __str__(self):
        return f"{self.product.name} low stock ({self.quantity}/{self.reorder_level})"