# 📦 Inventory Management System — Project Handoff

## What This Document Is
This is a complete handoff document for continuing development of the Inventory Management System (IMS) backend + new frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System  
**Goal:** Portfolio project for fullstack developer interviews  
**Stack:** Django + DRF (backend) + React (frontend, to be built)  
**Live Backend:** https://inventory-management-backend-g3e7.onrender.com  
**Swagger Docs:** https://inventory-management-backend-g3e7.onrender.com/swagger/  
**GitHub:** https://github.com/longreaksa404/inventory-management-backend  

---

## ✅ What Was Completed in the Previous Session

### Backend Bug Fixes (33 issues across 30 files)

#### Round 1 — Critical Bugs
| File | Fix |
|---|---|
| `apps/orders/signals.py` | Removed double stock deduction — signals + model methods both mutating stock |
| `apps/inventory/serializers.py` | Removed duplicate `apply_transaction()` call in serializer |
| `tests/conftest.py` | Fixed `Customer` NameError, invalid phone numbers, warehouse missing fields |
| `apps/inventory/models.py` | Role case `"Admin"` → `"admin"`, added audit trail to stock helper methods |
| `apps/orders/models.py` | `LowStockAlert` missing `warehouse`, no `select_for_update` in `ship()` |
| `apps/orders/permissions.py` | Typo `"confirm_purchase order"` → `"confirm_purchase_order"` |
| `apps/warehouses/models.py` | Added `__str__` method |
| `apps/inventory/signals.py` | Hardcoded personal emails → `settings.ADMIN_NOTIFICATION_EMAIL` |
| `apps/reports/tasks.py` | `quantity < 5` hardcoded → `quantity <= F('reorder_level')` |
| `apps/suppliers/models.py` | Removed dead imports causing circular dependency risk |
| `config/settings/base.py` | Added global pagination (50/page) |
| `config/settings/production.py` | Redis hard require — fails fast if missing in prod |
| All test files | Role assertions, warehouse fields, phantom `total_amount` field |

#### Round 2 — Logic & Design Bugs
| File | Fix |
|---|---|
| `apps/orders/views.py` | `log_status_change` was broken inside class, `update()` missing `select_for_update` |
| `apps/reports/signals.py` | Duplicate `StockReportEntry` receiver firing twice, dead `total_amount` guard |
| `apps/orders/tasks.py` | Receive task duplicated stock logic from `PurchaseOrder.receive()`, no audit on cancel |
| `apps/inventory/views.py` | `warehouse` not passed to stock methods (silent audit skip), duplicate import |
| `apps/orders/serializers.py` | Triple stock validation consolidated, fragile `isinstance` product resolution fixed |
| `apps/reports/views.py` | No `permission_classes` on ViewSets, O(n×m) query loop → 2 aggregated queries |
| `apps/accounts/models.py` | `create_superuser` phone_number=None passing through to ValueError guard |
| `pytest.ini` + `settings/test.py` | `--reuse-db` schema drift, pinned SQLite in-memory for tests |

#### Round 3 — Security & Remaining Bugs
| File | Fix |
|---|---|
| `apps/inventory/tasks.py` | Hardcoded email + `quantity < 5` → `reorder_level` |
| `apps/accounts/serializers.py` | `is_staff` and `role` were writable — anyone could self-assign admin |
| `apps/accounts/views.py` | Wrong serializer for read endpoints, unnecessary `@transaction.atomic` |
| `apps/inventory/permissions.py` | Missing `is_superuser` short-circuit, separated DELETE permission |
| `apps/suppliers/views.py` | Wrong MRO order for mixin |
| `tests/api/test_api_auth.py` | Missing `@pytest.mark.django_db` decorator |
| `tests/api/test_api_stock.py` | No `warehouse` param, misleading stock math |
| `tests/domain/inventory/test_inventory_tasks.py` | Wrong `reorder_level` values |

### Local Dev Setup (Completed)
- Pipenv virtualenv at: `C:\Users\acer\.virtualenvs\inventory-management-backend-lAitlqmP`
- Python 3.11 (Pipfile says 3.12 but 3.11 works fine)
- SQLite for local dev (`config/settings/local.py`)
- DBeaver installed for DB inspection
- VS Code Pylance configured via `pyrightconfig.json`

### New Files Created
- `config/settings/local.py` — SQLite + console email + eager Celery for local dev
- `pyrightconfig.json` — Pylance/Pyright config for VS Code
- `.vscode/settings.json` — VS Code interpreter path

### Status
✅ Server runs locally with `python manage.py runserver`  
✅ Migrations applied successfully  
✅ All Pylance import warnings resolved  
✅ DBeaver connected for DB inspection  

---

## 🗂️ Project Structure

```
inventory-management-backend/
├── apps/
│   ├── accounts/       # CustomUser, JWT auth, role-based access
│   ├── core/           # Base permissions, shared utilities
│   ├── inventory/      # Products, Categories, StockTransactions, LowStockAlerts
│   ├── orders/         # PurchaseOrders, SaleOrders, OrderStatusHistory
│   ├── reports/        # InventorySnapshot, CategorySummary, report entries
│   ├── suppliers/      # Supplier model
│   └── warehouses/     # Warehouse model
├── config/
│   └── settings/
│       ├── base.py     # Shared settings
│       ├── local.py    # SQLite, console email (NEW)
│       ├── development.py
│       ├── test.py     # In-memory SQLite, locmem email
│       └── production.py
├── tests/
│   ├── api/            # API endpoint tests
│   └── domain/         # Unit tests per app
├── api/urls.py         # All routes under /api/v1/
├── manage.py
├── Pipfile
├── requirements.txt
├── pyrightconfig.json  # NEW
└── pytest.ini
```

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access, can adjust stock |
| Manager | `"manager"` | Warehouse + stock oversight |
| Staff | `"staff"` | Orders, stock in/out |
| Customer | `"customer"` | Sales orders only |

**Important:** Always compare against lowercase stored values (`"admin"` not `"Admin"`).

---

## 🌐 API Endpoints (all under `/api/v1/`)

| Prefix | App | Key endpoints |
|---|---|---|
| `/accounts/` | Accounts | `register/`, `login/`, `profile/`, `change-password/` |
| `/inventory/` | Inventory | `products/`, `categories/`, `transactions/`, `stock-summary/` |
| `/inventory/products/{id}/stock/in/` | Inventory | Stock in |
| `/inventory/products/{id}/stock/out/` | Inventory | Stock out |
| `/inventory/products/{id}/stock/adjust/` | Inventory | Adjust (admin only) |
| `/warehouses/` | Warehouses | CRUD |
| `/suppliers/` | Suppliers | CRUD |
| `/orders/purchase-orders/` | Orders | Purchase order lifecycle |
| `/orders/sales/` | Orders | Sale order lifecycle |
| `/reports/inventory-value/` | Reports | Total inventory value |
| `/reports/low-stock/` | Reports | Low stock alerts |
| `/reports/category-summary/` | Reports | Per-category totals |
| `/reports/transaction-history/` | Reports | All order history |

---

## ⚙️ Local Dev Commands

```cmd
# Activate virtualenv
pipenv shell

# Set settings module (CMD — inside pipenv shell)
set DJANGO_SETTINGS_MODULE=config.settings.local

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver

# Run tests
pytest

# Run specific test file
pytest tests/domain/inventory/test_product_model.py -v
```

---

## 🚀 Production Deploy (Render)

- Push to GitHub → Render auto-deploys
- Build command: `./build.sh`
- Start command: `gunicorn config.wsgi:application`
- Environment variables needed: `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `ADMIN_NOTIFICATION_EMAIL`

---

## ⚠️ Known Remaining Items (Not Yet Done)

1. **Frontend not built yet** — React app to be created (see PROJECT_PLAN.md)
2. **No total_amount field on orders** — computed from items, not stored
3. **Celery Beat schedule** not configured for `notify_low_stock` periodic task
4. **No rate limiting** on API endpoints
5. **No API versioning** beyond URL prefix `/api/v1/`
6. **Warehouse not required** on stock in/out API — audit trail silently skipped if omitted
7. **CORS not configured yet** — needed before React frontend can call the API
