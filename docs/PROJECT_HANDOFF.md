# 📦 Inventory Management System — Project Handoff

## What This Document Is
Complete handoff for continuing development of the IMS backend + React frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System  
**Goal:** Portfolio project for fullstack developer interviews  
**Stack:** Django + DRF (backend) + React + TypeScript (frontend, in progress)  
**Live Backend:** https://inventory-management-backend-g3e7.onrender.com  
**Swagger Docs:** https://inventory-management-backend-g3e7.onrender.com/swagger/  
**Admin Panel:** https://inventory-management-backend-g3e7.onrender.com/admin/  
**GitHub:** https://github.com/longreaksa404/inventory-management-system  
**Frontend:** Not yet deployed (deploy to Vercel once login page works)

---

## 🗂️ Monorepo Structure

```
inventory-management-system/
├── backend/                        ← Django + DRF (fully built + deployed)
│   ├── apps/
│   │   ├── accounts/
│   │   ├── core/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── reports/
│   │   ├── suppliers/
│   │   └── warehouses/
│   ├── config/
│   │   └── settings/
│   │       ├── base.py
│   │       ├── local.py
│   │       ├── test.py
│   │       └── production.py
│   ├── api/
│   ├── tests/
│   ├── docs/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Pipfile
│   ├── pytest.ini
│   ├── build.sh
│   ├── start.sh
│   ├── render.yaml             ← has rootDir: backend
│   └── Dockerfile
├── frontend/                       ← React app (in progress)
│   ├── src/
│   │   ├── api/                ✅ all API files written
│   │   ├── types/              ✅ all TypeScript interfaces
│   │   ├── components/ui/      ✅ shadcn components
│   │   ├── lib/utils.ts        ✅ cn() utility
│   │   ├── stores/             ← next: authStore.ts
│   │   ├── hooks/              ← next: useAuth.ts
│   │   ├── routes/             ← next: ProtectedRoute.tsx
│   │   ├── pages/              ← next: LoginPage, DashboardPage
│   │   └── components/layout/  ← next: Sidebar, Navbar, PageLayout
│   ├── .env                    ✅ VITE_API_URL=http://127.0.0.1:8000
│   ├── components.json         ✅ shadcn config
│   ├── tailwind.config.js      ✅ Tailwind v3 + shadcn tokens
│   ├── vite.config.ts          ✅ path alias @/ → src/
│   └── package.json
├── .gitignore
└── README.md
```

---

## ✅ Session 1 — Backend Bug Fixes (33 issues across 30 files)

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
- Fixed double stock application bug in `apps/inventory/models.py`
- Added `gunicorn==23.0.0` and `whitenoise==6.9.0` to `requirements.txt`
- **50/50 tests passing** ✅
- **Backend live on Render** ✅

---

## ✅ Session 5 — Frontend Scaffolding + API Layer

- Restructured repo into monorepo: `backend/` and `frontend/`
- Updated `render.yaml` with `rootDir: backend`
- Scaffolded React + Vite + TypeScript frontend at `frontend/`
- Installed all dependencies:
  - `axios`, `@tanstack/react-query`, `react-router-dom`
  - `react-hook-form`, `zod`, `@hookform/resolvers`
  - `recharts`, `lucide-react`, `clsx`, `tailwind-merge`
  - Tailwind CSS v3 + postcss + autoprefixer
  - shadcn/ui 4.10.0 (Nova preset, Radix)
- Fixed shadcn setup issues (Tailwind v4 conflict, `@` path issue)
- Written all frontend foundation files:
  - `src/types/index.ts` — complete TypeScript interfaces for all API shapes
  - `src/api/client.ts` — Axios + JWT interceptors with auto-refresh queue
  - `src/api/auth.ts` — login, profile, change password
  - `src/api/products.ts` — products, categories, stock mutations
  - `src/api/warehouses.ts` — warehouse CRUD
  - `src/api/suppliers.ts` — supplier CRUD
  - `src/api/orders.ts` — purchase + sale order full lifecycle
  - `src/api/reports.ts` — all report endpoints

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
| `/accounts/` | `register/`, `login/`, `profile/`, `change-password/`, `refresh/` |
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

| Priority | Page | Status |
|---|---|---|
| 1 | Login | ← next |
| 2 | Dashboard (KPIs + charts) | pending |
| 3 | Products CRUD | pending |
| 4 | Categories CRUD | pending |
| 5 | Warehouses CRUD | pending |
| 6 | Suppliers CRUD | pending |
| 7 | Stock Transactions | pending |
| 8 | Purchase Orders lifecycle | pending |
| 9 | Sale Orders lifecycle | pending |
| 10 | Low Stock Alerts | pending |
| 11 | Reports | pending |

---

## ⚙️ Local Dev Commands

```cmd
# Backend
cd backend
pipenv shell
set DJANGO_SETTINGS_MODULE=config.settings.local
python manage.py runserver

# Frontend (separate terminal)
cd frontend
npm run dev

# Backend tests
cd backend
set DJANGO_SETTINGS_MODULE=config.settings.test
pytest
```

---

## ⚠️ Known Remaining Items

1. **Frontend auth + pages not built yet** — see NEXT_STEPS.md for exact order
2. **Frontend not deployed** — deploy to Vercel after login page works
3. **CORS_ALLOWED_ORIGINS on Render** — add real Vercel URL once frontend is deployed
4. **No total_amount field on orders** — computed from items, not stored
5. **Celery Beat schedule** not configured for `notify_low_stock` periodic task
6. **No rate limiting** on API endpoints
7. **Database expires July 16, 2026** — Render free PostgreSQL 90-day limit
8. **Pipfile says python_version = "3.12"** — harmless, actual venv is 3.11.4