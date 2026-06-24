# 📦 Inventory Management System — Project Handoff

## What This Document Is
Complete handoff for continuing development of the IMS backend + React frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System
**Goal:** Portfolio project for fullstack developer interviews
**Stack:** Django + DRF (backend) + React (frontend, in progress)
**Live Backend:** https://inventory-management-system-uet9.onrender.com
**Swagger Docs:** https://inventory-management-system-uet9.onrender.com/swagger/
**Admin Panel:** https://inventory-management-system-uet9.onrender.com/admin/
**GitHub:** https://github.com/longreaksa404/inventory-management-system

---

## ✅ Session 1 — Bug Fixes (33 issues across 30 files)

### Round 1 — Critical Bugs
| File | Fix |
|---|---|
| `apps/orders/signals.py` | Removed double stock deduction |
| `apps/inventory/serializers.py` | Removed duplicate `apply_transaction()` call |
| `tests/conftest.py` | Fixed `Customer` NameError, invalid phone numbers, warehouse missing fields |
| `apps/inventory/models.py` | Role case `"Admin"` → `"admin"`, added audit trail to stock helpers |
| `apps/orders/models.py` | `LowStockAlert` missing `warehouse`, no `select_for_update` in `ship()` |
| `apps/orders/permissions.py` | Typo `"confirm_purchase order"` → `"confirm_purchase_order"` |
| `apps/warehouses/models.py` | Added `__str__` method |
| `apps/inventory/signals.py` | Hardcoded personal emails → `settings.ADMIN_NOTIFICATION_EMAIL` |
| `apps/reports/tasks.py` | `quantity < 5` hardcoded → `quantity <= F('reorder_level')` |
| `apps/suppliers/models.py` | Removed dead imports causing circular dependency risk |
| `config/settings/base.py` | Added global pagination (50/page) |
| `config/settings/production.py` | Redis hard require — fails fast if missing in prod |

### Round 2 — Logic & Design Bugs
| File | Fix |
|---|---|
| `apps/orders/views.py` | `log_status_change` broken inside class, `update()` missing `select_for_update` |
| `apps/reports/signals.py` | Duplicate `StockReportEntry` receiver firing twice |
| `apps/orders/tasks.py` | Receive task duplicated stock logic, no audit on cancel |
| `apps/inventory/views.py` | `warehouse` not passed to stock methods, duplicate import |
| `apps/orders/serializers.py` | Triple stock validation consolidated |
| `apps/reports/views.py` | No `permission_classes` on ViewSets, O(n×m) query loop fixed |
| `apps/accounts/models.py` | `create_superuser` phone_number=None crashing |
| `pytest.ini` + `settings/test.py` | `--reuse-db` schema drift, pinned SQLite in-memory |

### Round 3 — Security & Remaining Bugs
| File | Fix |
|---|---|
| `apps/inventory/tasks.py` | Hardcoded email + `quantity < 5` → `reorder_level` |
| `apps/accounts/serializers.py` | `is_staff` and `role` were writable — privilege escalation risk |
| `apps/accounts/views.py` | Wrong serializer for read endpoints |
| `apps/inventory/permissions.py` | Missing `is_superuser` short-circuit |
| `apps/suppliers/views.py` | Wrong MRO order for mixin |

---

## ✅ Session 2 — Infrastructure

- Repo renamed to `inventory-management-system`
- New Render web service + PostgreSQL database created
- `build.sh` fixed for reliable superuser creation
- All migrations applied, admin working

---

## ✅ Session 3 — CORS

- Added `django-cors-headers==4.9.0`
- CORS configured in `base.py`, `local.py`, `production.py`
- `dj-database-url` added to `requirements.txt`
- `python manage.py check` passes clean

---

## ✅ Session 4 — Deploy Fixes + Tests Green

- Removed `pywin32==312` from `requirements.txt` (Windows-only, broke Render)
- Fixed double stock application bug in `apps/inventory/models.py`:
  - Stock helpers were updating quantity AND creating StockTransaction (which also applies change)
  - Fix: when user+warehouse provided, delegate to StockTransaction only; use `refresh_from_db()` after
- Added `gunicorn==23.0.0` and `whitenoise==6.9.0` to `requirements.txt`
- **50/50 tests passing** ✅
- **Backend live on Render** ✅

---

## 🗂️ Project Structure

```
inventory-management-system/
├── apps/
│   ├── accounts/       # CustomUser, JWT auth, RBAC
│   ├── core/           # Base permissions, shared utilities
│   ├── inventory/      # Products, Categories, StockTransactions, LowStockAlerts
│   ├── orders/         # PurchaseOrders, SaleOrders, OrderStatusHistory
│   ├── reports/        # InventorySnapshot, CategorySummary, report entries
│   ├── suppliers/      # Supplier model
│   └── warehouses/     # Warehouse model
├── config/
│   └── settings/
│       ├── base.py
│       ├── local.py        # SQLite, CORS_ALLOW_ALL_ORIGINS=True
│       ├── test.py         # In-memory SQLite, locmem email
│       └── production.py   # Render, CORS allowlist + Vercel regex
├── frontend/           # React app (to be built)
├── docs/
├── tests/
├── api/urls.py
├── build.sh
├── manage.py
└── requirements.txt
```

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access, can adjust stock |
| Manager | `"manager"` | Warehouse + stock oversight |
| Staff | `"staff"` | Orders, stock in/out |
| Customer | `"customer"` | Sales orders only |

**Always compare against lowercase stored values.**

---

## 🌐 API Endpoints (all under `/api/v1/`)

| Prefix | Key endpoints |
|---|---|
| `/accounts/` | `register/`, `login/`, `profile/`, `change-password/` |
| `/inventory/` | `products/`, `categories/`, `transactions/`, `stock-summary/` |
| `/inventory/products/{id}/stock/in/` | Stock in (needs `warehouse` in body) |
| `/inventory/products/{id}/stock/out/` | Stock out (needs `warehouse` in body) |
| `/inventory/products/{id}/stock/adjust/` | Adjust (admin only, needs `warehouse`) |
| `/warehouses/` | CRUD |
| `/suppliers/` | CRUD |
| `/orders/purchase-orders/` | Purchase order lifecycle |
| `/orders/sales/` | Sale order lifecycle |
| `/reports/inventory-value/` | Total inventory value |
| `/reports/low-stock/` | Low stock alerts |
| `/reports/category-summary/` | Per-category totals |
| `/reports/transaction-history/` | All order history |

---

## 📊 Frontend Pages to Build (in order)

| Priority | Page | API endpoint(s) |
|---|---|---|
| 1 | Login | `/accounts/login/` |
| 2 | Dashboard | `/reports/inventory-value/`, `/reports/low-stock/`, `/reports/category-summary/` |
| 3 | Products | `/inventory/products/` |
| 4 | Categories | `/inventory/categories/` |
| 5 | Warehouses | `/warehouses/` |
| 6 | Suppliers | `/suppliers/` |
| 7 | Stock Transactions | `/inventory/transactions/`, stock in/out/adjust |
| 8 | Purchase Orders | `/orders/purchase-orders/` |
| 9 | Sale Orders | `/orders/sales/` |
| 10 | Low Stock Alerts | `/inventory/low-stock-alerts/` |
| 11 | Reports | `/reports/transaction-history/` |

---

## ⚙️ Local Dev Commands

```cmd
cd C:\Users\acer\Documents\Reaksa\Code\Inventory\inventory-management-system

REM Backend
pipenv shell
set DJANGO_SETTINGS_MODULE=config.settings.local
python manage.py runserver

REM Tests
set DJANGO_SETTINGS_MODULE=config.settings.test
pytest

REM Frontend (once scaffolded)
cd frontend
npm run dev
```

---

## ⚠️ Known Remaining Items

1. **Frontend not built yet** — scaffold at `frontend/` (see NEXT_STEPS.md)
2. **CORS_ALLOWED_ORIGINS on Render** — add real Vercel URL once frontend is deployed
3. **No total_amount field on orders** — computed from items, not stored
4. **Celery Beat schedule** not configured for `notify_low_stock` periodic task
5. **No rate limiting** on API endpoints
6. **Database expires July 16, 2026** — Render free PostgreSQL 90-day limit
7. **Pipfile says python_version = "3.12"** — harmless, actual venv is 3.11.4
8. **Vim is default git editor** — run `git config --global core.editor "code --wait"` to use VS Code