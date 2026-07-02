# 📦 Inventory Management System (IMS)

**A full-stack inventory & order management platform built with Django REST Framework and React.**

Built as a portfolio project to demonstrate production-level fullstack engineering: real business logic (multi-step order lifecycles, race-condition-safe stock mutations, async background processing), not just CRUD screens.

---

## 🔗 Live Demo

| | |
|---|---|
| **Frontend (Vercel)** | https://inventory-management-system-liard-delta.vercel.app |
| **Backend API (Render)** | https://inventory-management-system-uet9.onrender.com |
| **Swagger UI** | https://inventory-management-system-uet9.onrender.com/swagger/ |
| **Redoc** | https://inventory-management-system-uet9.onrender.com/redoc/ |
| **Admin panel** | https://inventory-management-system-uet9.onrender.com/admin/ |
| **Source** | https://github.com/longreaksa404/inventory-management-system |

---

## 🛠 Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- TailwindCSS + shadcn/ui (radix-nova style)
- TanStack React Query — server state, caching, invalidation
- React Hook Form + Zod v4 — schema-validated forms
- React Router v6 — lazy-loaded routes, role-guarded routes
- Axios — JWT-aware HTTP client with auto token refresh
- Recharts — dashboard and report visualizations

**Backend**
- Django 5.2 + Django REST Framework
- PostgreSQL (Supabase, production) / SQLite (local dev)
- Simple JWT — access/refresh token auth
- Celery + Redis (Upstash) — async order processing and scheduled alerts
- django-filter, drf-yasg (Swagger/Redoc)
- pytest + pytest-django — 80+ backend tests

**Infrastructure**
- Frontend → Vercel
- Backend → Render (Docker/Gunicorn)
- Database → Supabase PostgreSQL (session pooler, IPv4-safe)
- Redis → Upstash (Celery broker/result backend)

---

## 🔑 API Basics

- **Auth:** `POST /api/v1/accounts/login/` → `{access, refresh}`. Send `Authorization: Bearer {access_token}` on every subsequent request.
- **Token lifetimes:** access token 2 hours, refresh token 7 days — handled transparently by the frontend's Axios interceptor.
- **Roles:** lowercase string values — `"admin"`, `"manager"`, `"staff"`, `"customer"`.
- **Pagination:** every list endpoint returns `{count, next, previous, results[]}`.
- **Stock mutations:** Stock In/Out/Adjust endpoints require a `warehouse` ID in the request body — without it, the audit `StockTransaction` record is silently skipped.

---

## 🚀 Key Features

- **Auth & RBAC** — JWT login, auto-refresh, 4-tier role system, admin-only routes
- **Dashboard** — live KPIs (inventory value, low stock count, pending orders), category value chart
- **Products** — full CRUD, search/filter/pagination, per-product detail page with stock transaction history
- **Categories, Warehouses, Suppliers, Customers** — CRUD with role-scoped permissions
- **Stock Transactions** — Stock In / Stock Out / Adjust (admin-only), all warehouse-scoped and audited
- **Purchase Orders** — draft → confirm → receive, async stock increment via Celery
- **Sale Orders** — draft → confirm → ship → invoice, async stock deduction + low-stock alert trigger
- **Low Stock Alerts** — real-time list, severity-ranked, tied to per-product reorder levels
- **Reports** — inventory value, category summary (bar + pie), transaction history, low-stock summary
- **User Management** (admin-only) — change role, activate/deactivate, self-modification guard
- **Async UX** — 202-Accepted + polling pattern so ship/receive actions don't block the UI

---

## ⚙️ Local Development

### Backend
```bash
cd backend
pipenv shell
# Windows PowerShell:
$env:DJANGO_SETTINGS_MODULE="config.settings.local"; python manage.py migrate
python manage.py runserver
```
Local settings (`config.settings.local`) use SQLite, console email, eager Celery, and `CORS_ALLOW_ALL_ORIGINS = True` — no Postgres/Redis required to run locally.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Backend | http://127.0.0.1:8000 |
| Frontend | http://localhost:5173 |
| Swagger | http://127.0.0.1:8000/swagger/ |

### Tests
```bash
cd backend
pytest -v          # full suite
pytest --cov        # with coverage
```

---

## 📁 Project Structure

```
├── backend/
│   ├── apps/
│   │   ├── accounts/    # Custom user model, JWT auth, RBAC, user management
│   │   ├── inventory/   # Products, categories, stock transactions, alerts
│   │   ├── orders/      # Purchase/Sale orders, state machines, Celery tasks
│   │   ├── suppliers/   # Supplier CRUD
│   │   ├── warehouses/  # Warehouse CRUD
│   │   └── reports/     # Aggregated reporting endpoints + signals
│   ├── config/           # Settings (base/local/dev/prod/test), Celery, urls
│   └── tests/             # domain/ (business logic) + api/ (endpoint contracts)
└── frontend/
    └── src/
        ├── api/           # Axios instance + typed API modules per resource
        ├── components/    # ui/ (shadcn) + layout/ (Sidebar, Navbar, PageLayout)
        ├── hooks/         # useAuth, useOrderStatusPolling
        ├── pages/         # One folder per feature area
        ├── routes/        # ProtectedRoute, AdminRoute
        ├── stores/        # authStore (Context + useReducer)
        └── types/         # Shared TypeScript interfaces
```

---

## 💼 Interview Talking Points

| Topic | Where to look |
|---|---|
| Race condition prevention | `apps/orders/models.py` — `SaleOrder.ship()`, `PurchaseOrder.receive()` |
| Atomic transactions | Same as above, plus `apps/orders/views.py` `SalesOrderViewSet.update()` |
| Async background processing | `apps/orders/tasks.py`, `useOrderStatusPolling.ts` |
| RBAC design | `apps/*/permissions.py` — per-app `BasePermission` classes |
| JWT refresh flow | `frontend/src/api/client.ts` — response interceptor with request queueing |
| Signal-driven side effects | `apps/inventory/signals.py`, `apps/reports/signals.py` |
| Deliberate scope management | `docs/PROJECT_SCOPE.md` — features scoped then consciously deferred |
| Testing strategy | `backend/tests/domain/` vs `backend/tests/api/` split |

---

## 🎯 Purpose

This project demonstrates production-level backend and fullstack engineering: handling race conditions, maintaining data consistency across async workflows, enforcing fine-grained authorization, and building a responsive UI on top of eventually-consistent async operations. It's intended as a realistic foundation for a small-to-medium enterprise inventory system, not a tutorial CRUD app.