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

> ⚡ Hosted on Render's free tier — the backend sleeps after inactivity and can take 30–60s to wake up on first load.

**Demo login** — *(fill in a read-only demo account here before the interview, e.g. `demo@example.com` / a throwaway password)*

---

## 📸 Screenshots

*(add screenshots here — Dashboard, Products, Sale Order lifecycle, Reports)*

| Dashboard | Sale Orders | Reports |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

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

## 🏗️ Architecture Highlights

### 1. Race-condition-safe stock mutations
Every operation that changes `Product.quantity` — sale shipping, purchase receiving, manual stock in/out/adjust — runs inside a `transaction.atomic()` block using `select_for_update()` to lock the product row. This prevents two concurrent requests from both reading stale stock, both passing an "enough stock?" check, and double-deducting inventory.

```python
# apps/orders/models.py — SaleOrder.ship()
with transaction.atomic():
    for item in self.items.select_related('product'):
        product = Product.objects.select_for_update().get(pk=item.product_id)
        if product.quantity < item.quantity:
            raise ValidationError(f"Not enough stock for {product.name}")
        product.quantity -= item.quantity
        product.save()
```

### 2. Full audit trail
Every stock change — whether from a manual Stock In/Out, an admin Adjustment, or an order shipping/receiving — creates a `StockTransaction` record (`IN` / `OUT` / `ADJ`) with `performed_by`, `warehouse`, and `notes`. Nothing mutates `quantity` silently.

### 3. Async order lifecycle (Celery)
`Ship` and `Receive` actions return `202 Accepted` immediately and hand off to Celery tasks (`process_sales_order_shipping`, `process_purchase_order_receiving`) with automatic retry/backoff. The frontend polls the single-order endpoint every 2s (up to ~15s) via a shared `useOrderStatusPolling` hook until the status changes, then refreshes the list — no manual page refresh needed.

### 4. Role-based access control (RBAC)
Four roles — `admin`, `manager`, `staff`, `customer` — enforced via custom DRF `BasePermission` classes per app (`inventory/permissions.py`, `orders/permissions.py`, `accounts/permissions.py`), backed by Django's built-in permission/codename system rather than hardcoded role checks scattered through views. The frontend mirrors this with route guards (`ProtectedRoute`, `AdminRoute`) and a single `useAuth()` hook exposing `isAdmin` / `isManager` / `hasRole()` helpers.

### 5. JWT auth with silent refresh
Axios response interceptor catches `401`s, queues concurrent failed requests, exchanges the refresh token for a new access token, retries the original request — the user never sees a login interruption until the 7-day refresh token itself expires.

### 6. Signal-driven low-stock alerts
A `post_save` signal on `Product`/order shipping checks `quantity <= reorder_level` (per-product threshold, not a hardcoded magic number) and creates/updates a `LowStockAlert` via `update_or_create` (not `get_or_create` — so an alert's quantity stays current on repeated breaches, not stuck at its first-triggered value). A downstream signal emails an admin and writes a `StockReportEntry` for the Reports page.

### 7. Business-logic-first testing
80+ pytest tests cover domain logic (stock transactions, order state machines, permission edge cases, signal chains) and API contracts (auth, RBAC per role, reorder-level boundary conditions) — not just "does the endpoint return 200."

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