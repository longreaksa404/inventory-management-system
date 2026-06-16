# 📦 Inventory Management System — Project Handoff

## What This Document Is
This is a complete handoff document for continuing development of the Inventory Management System (IMS) backend + new frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System  
**Goal:** Portfolio project for fullstack developer interviews  
**Stack:** Django + DRF (backend) + React (frontend, to be built)  
**Live Backend:** https://inventory-management-system-uet9.onrender.com  
**Swagger Docs:** https://inventory-management-system-uet9.onrender.com/swagger/  
**Admin Panel:** https://inventory-management-system-uet9.onrender.com/admin/  
**GitHub:** https://github.com/longreaksa404/inventory-management-system  

---

## ✅ What Was Completed — Session 1 (Bug Fixes)

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

---

## ✅ What Was Completed — Session 2 (Infrastructure)

### Repo Renamed
- GitHub repo renamed from `inventory-management-backend` → `inventory-management-system`
- Local git remote updated to point to new URL
- All existing code and history preserved

### New Render Web Service
- Created new Render web service named `inventory-management-system`
- URL: `https://inventory-management-system-uet9.onrender.com`
- Region: Singapore
- Runtime: Python 3
- Build Command: `./build.sh`
- Start Command: `gunicorn config.wsgi:application`
- Auto-Deploy: On Commit (pushes to main trigger deploy automatically)

### New PostgreSQL Database
- Created new Render PostgreSQL database named `inventory-db`
- Region: Singapore (same as web service — uses internal connection URL)
- Connected to the new web service via `DATABASE_URL` env var
- Free tier — **expires July 16, 2026** (upgrade or recreate before then)

### Environment Variables (new service)
All variables configured on the new Render service:
```
CELERY_BROKER_URL
CREATE_SUPERUSER = True
DATABASE_URL          ← internal Render PostgreSQL URL
DEBUG
DJANGO_SETTINGS_MODULE = config.settings.production
DJANGO_SUPERUSER_EMAIL
DJANGO_SUPERUSER_FIRST_NAME
DJANGO_SUPERUSER_LAST_NAME
DJANGO_SUPERUSER_PASSWORD
DJANGO_SUPERUSER_PHONE_NUMBER
REDIS_URL
SECRET_KEY
ADMIN_NOTIFICATION_EMAIL
DEFAULT_FROM_EMAIL
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD
```

### build.sh Fixed
- Added `python manage.py migrate --no-input`
- Replaced unreliable heredoc (`<< END`) with `python manage.py shell -c` for superuser creation
- Superuser is created automatically on every deploy if `CREATE_SUPERUSER=True` and user doesn't already exist

### Verified Working
- ✅ Swagger UI accessible at `/swagger/`
- ✅ Admin panel accessible at `/admin/`
- ✅ Superuser login works
- ✅ All Django apps visible in admin (Accounts, Inventory, Orders, Periodic Tasks, Reports, Suppliers, Warehouses)
- ✅ Migrations applied successfully on fresh database

---

## 🗂️ Project Structure

```
inventory-management-system/    ← renamed from inventory-management-backend
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
│       ├── base.py
│       ├── local.py        # SQLite, console email
│       ├── development.py
│       ├── test.py         # In-memory SQLite, locmem email
│       └── production.py
├── tests/
│   ├── api/
│   └── domain/
├── api/urls.py
├── build.sh            # Fixed: migrate + shell -c superuser creation
├── manage.py
├── requirements.txt
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
cd C:\Users\acer\Documents\Reaksa\Code\Inventory\inventory-management-system

pipenv shell
set DJANGO_SETTINGS_MODULE=config.settings.local
python manage.py migrate
python manage.py runserver

pytest
```

**Virtualenv path:** `C:\Users\acer\.virtualenvs\inventory-management-backend-lAitlqmP`

---

## 🚀 Production Deploy (Render)

- Push to `main` → Render auto-deploys
- Build: `./build.sh` (installs deps, collectstatic, migrate, create superuser if needed)
- Start: `gunicorn config.wsgi:application`
- Free tier spins down after inactivity — first request may take 30-60 seconds

---

## ⚠️ Known Remaining Items (Not Yet Done)

1. **Tests not run yet** — full pytest suite has not been executed; run before any new feature work
2. **Frontend not built yet** — React app to be created (see PROJECT_PLAN.md)
3. **CORS not configured** — needed before React frontend can call the API
4. **No total_amount field on orders** — computed from items, not stored
5. **Celery Beat schedule** not configured for `notify_low_stock` periodic task
6. **No rate limiting** on API endpoints
7. **Old Render service** (`inventory-management-backend`) not yet deleted — clean it up
8. **Database expires July 16, 2026** — Render free PostgreSQL has 90-day limit; upgrade or recreate
9. **Monorepo structure not set up yet** — frontend will be added as `frontend/` subfolder in same repo