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
- Replaced unreliable heredoc with `python manage.py shell -c` for superuser creation
- Superuser is created automatically on every deploy if `CREATE_SUPERUSER=True` and user doesn't already exist

### Verified Working
- ✅ Swagger UI accessible at `/swagger/`
- ✅ Admin panel accessible at `/admin/`
- ✅ Superuser login works
- ✅ All Django apps visible in admin
- ✅ Migrations applied successfully on fresh database

---

## ✅ What Was Completed — Session 3 (CORS)

### CORS Added for React Frontend

**Package installed:** `django-cors-headers==4.9.0`

**Files changed:**

| File | Change |
|---|---|
| `requirements.txt` | Added `django-cors-headers==4.9.0` and `dj-database-url==3.1.2` |
| `config/settings/base.py` | Added `corsheaders` to `INSTALLED_APPS`, `CorsMiddleware` to `MIDDLEWARE` (before `CommonMiddleware`), and CORS config block |
| `config/settings/local.py` | Added `CORS_ALLOW_ALL_ORIGINS = True` for local dev |
| `config/settings/production.py` | Added `CORS_ALLOWED_ORIGINS` from env + `CORS_ALLOWED_ORIGIN_REGEXES` for Vercel preview deploys |

**CORS design decisions:**
- `CORS_ALLOW_CREDENTIALS = False` — JWT goes in `Authorization` header, not cookies; no credentials needed
- `CORS_ALLOW_ALL_ORIGINS = True` only in `local.py` — never bleeds to production
- `CORS_ALLOWED_ORIGIN_REGEXES` covers `*.vercel.app` so Vercel preview deployments don't need manual allowlist updates
- `CORS_ALLOWED_ORIGINS` read from env var on Render — update once Vercel URL is known

**Render env var to add once frontend is deployed:**
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Virtualenv situation:**
- New virtualenv created at `C:\Users\acer\.virtualenvs\inventory-management-system-y9v2OP1d` (Python 3.11.4)
- Old virtualenv at `inventory-management-backend-lAitlqmP` is now unused — can be deleted
- Pipfile still says `python_version = "3.12"` — harmless warning, Django runs fine on 3.11
- `dj-database-url` was missing from `requirements.txt` — now added

**Verified:** `python manage.py check` returns `System check identified no issues (0 silenced)`

---

## 🗂️ Project Structure

```
inventory-management-system/
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
│       ├── base.py         # CORS config lives here
│       ├── local.py        # CORS_ALLOW_ALL_ORIGINS = True
│       ├── development.py
│       ├── test.py         # In-memory SQLite, locmem email
│       └── production.py   # CORS_ALLOWED_ORIGINS + regex for Vercel
├── docs/
│   ├── PROJECT_HANDOFF.md  # This file
│   ├── NEXT_STEPS.md
│   ├── PROJECT_PLAN.md
│   └── PROJECT_SCOPE.md
├── tests/
│   ├── api/
│   └── domain/
├── api/urls.py
├── build.sh
├── manage.py
├── requirements.txt        # Now includes django-cors-headers + dj-database-url
└── pytest.ini
```

**Frontend not created yet** — will live at `frontend/` subfolder at repo root.

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
python manage.py runserver
```

**Active virtualenv:** `C:\Users\acer\.virtualenvs\inventory-management-system-y9v2OP1d` (Python 3.11.4)

```cmd
pytest
```

---

## 🚀 Production Deploy (Render)

- Push to `main` → Render auto-deploys
- Build: `./build.sh` (installs deps, collectstatic, migrate, create superuser if needed)
- Start: `gunicorn config.wsgi:application`
- Free tier spins down after inactivity — first request may take 30-60 seconds

---

## ⚠️ Known Remaining Items

1. **Tests not run yet** — full pytest suite has not been executed against the new virtualenv; run before any new feature work
2. **Frontend not built yet** — React app to be created at `frontend/` (see PROJECT_PLAN.md)
3. **CORS_ALLOWED_ORIGINS on Render** — add the real Vercel URL once frontend is deployed
4. **No total_amount field on orders** — computed from items, not stored
5. **Celery Beat schedule** not configured for `notify_low_stock` periodic task
6. **No rate limiting** on API endpoints
7. **Old Render service** (`inventory-management-backend`) not yet deleted — clean it up
8. **Database expires July 16, 2026** — Render free PostgreSQL has 90-day limit
9. **Pipfile says python_version = "3.12"** — harmless but worth updating to `"3.11"` to match the actual venv