# 📦 Inventory Management System (IMS) - Project Handoff

## What This Document Is
Complete handoff for continuing development of the IMS backend + React frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System
**Goal:** Portfolio project for fullstack developer interviews
**Stack:** Django + DRF (backend) + React + TypeScript (frontend)
**Live Frontend:** https://inventory-management-system-liard-delta.vercel.app
**Live Backend:** https://inventory-management-system-uet9.onrender.com
**Swagger Docs:** https://inventory-management-system-uet9.onrender.com/swagger/
**Admin Panel:** https://inventory-management-system-uet9.onrender.com/admin/
**GitHub:** https://github.com/longreaksa404/inventory-management-system

---

## 🗄️ Database Architecture

| Environment | Database | Location |
|---|---|---|
| Local dev | SQLite | `backend/db.sqlite3` (via `config.settings.local`, the default) |
| Production | PostgreSQL | Supabase (Singapore, session pooler) |

**Supabase project ID:** `nducnhxvrzxdeucrijeu`
**Connection type:** Session Pooler (NOT Direct — Render is IPv4-only)

---

## ✅ Session History

- **Session 19** — Interview-prep session, no application code changed. **Verified** the `is_active` gap flagged in Session 18 was already fixed in the live repo (`UserListSerializer.Meta.fields` includes `is_active`; `User` TS interface includes `is_active: boolean`) — no action needed, closed out. **Rewrote `README.md`** for interview readiness: removed the "Architecture Highlights" deep-dive section and the placeholder "Screenshots" section (owner's explicit call — kept the README leaner, screenshots to be added manually later), added a GitHub source link to the Live Demo table, added a new "API Basics" section (login flow, token lifetimes, lowercase role values, pagination shape, warehouse-required stock mutation rule). Resolved a stale Render URL discrepancy between the old README and the docs — canonical backend URL confirmed as `https://inventory-management-system-uet9.onrender.com`. **Configured an UptimeRobot monitor** (HTTP(s), 5-min interval, email alerts) against `GET /api/` (the DB-free `health_check` view) to prevent the Render free-tier backend from cold-starting during the live interview demo — closes the last open Tier 5 item from `PROJECT_SCOPE.md`. Confirmed (but did not apply) the one-line ReportsPage low-stock label fix — still open, see `docs/NEXT_STEPS.md`.
- **Session 18** — **83/83 tests passing (up from 68/73 after Session 17 patch).** Built **Tier 4 Item 1: User Management page** — `UserManagementView` (admin-only `GET/PATCH /api/v1/accounts/<id>/`), `UserManagementSerializer` (role + is_active writable, is_staff auto-synced from role change, all profile fields read-only), `AdminRoute` frontend guard, `UsersPage.tsx` (inline role dropdown, activate/deactivate toggle, self-protection shield icon, filter by role, skeleton loading), `userManagement.ts` API layer, `test_api_user_management.py` (7 tests, all passing). Built **Tier 4 Item 2: Product detail page** — `ProductDetailPage.tsx` at `/products/:id` (product info card with stock health bar + reorder level, paginated stock transaction history table). `ProductsPage.tsx` product name becomes a `<Link>` to the detail page. `App.tsx` updated with both new lazy imports and routes. Found (and Session 19 confirmed resolved) an `is_active` gap in `UserListSerializer` and the `User` TypeScript type.
- **Session 17** — Ran Customer test suite against live repo: 68/73 (5 failures all traced to `CustomUserManager.create_user()` requiring `phone_number` for non-superuser accounts, breaking customer creation without a phone). Fix delivered and applied: `role == 'customer'` now exempts the phone requirement alongside `is_superuser`. Suite confirmed 83/83 after fix applied in Session 18.
- **Session 16** — Wrote `backend/tests/api/test_api_customers.py` (14 tests).
- **Session 15** — Customer management feature: backend `CustomerSerializer`/`CustomerListCreateView`/`CustomerDetailView`/`CustomerPermission`; frontend `CustomersPage.tsx` + inline "+ New customer" quick-create in Sale Order form.
- **Session 14** — Tier 3 complete: `useOrderStatusPolling` hook, wired into both order pages.
- **Session 13** — Tier 1 complete: fixed two low-stock alert bugs. Fixed local dev CORS (manage.py default → config.settings.local).
- **Session 12** — Reviewed and prioritized full backlog. Planning only.
- **Session 11** — Fixed Product #N / Warehouse #N display bugs in LowStockReportView, DashboardPage, AlertsPage.
- **Session 10** — Deployed frontend to Vercel, added vercel.json SPA fix.
- **Session 9** — Fixed Render Root Directory, migrated DB to Supabase.
- **Session 8** — Stock, PurchaseOrders, SaleOrders, Alerts, Reports pages + App.tsx wired.
- **Session 7** — Categories, Warehouses, Suppliers pages.
- **Session 6** — Auth flow + Dashboard + Products page.
- **Session 5** — Frontend scaffolding + API layer.
- **Session 4** — Deploy fixes + tests green (50/50).
- **Session 3** — CORS.
- **Session 2** — Infrastructure (Render deploy).
- **Session 1** — Backend bug fixes.

---

## 🗂️ File Tree (current)

```
inventory-management-system/
├── README.md                         ✅ Rewritten Session 19 — interview-ready,
│                                          GitHub link + API Basics section added
├── backend/
│   ├── manage.py                     ✅ default: config.settings.local
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── models.py             ✅ phone_number fix applied (role='customer' exempt)
│   │   │   ├── views.py              ✅ + CustomerListCreateView, CustomerDetailView, UserManagementView
│   │   │   ├── serializers.py        ✅ + CustomerSerializer, UserManagementSerializer
│   │   │   │                            ✅ UserListSerializer.is_active confirmed present (Session 19)
│   │   │   ├── permissions.py        ✅ CustomerPermission
│   │   │   └── urls.py               ✅ + /customers/, /customers/<id>/, /<id>/
│   │   ├── inventory/                ✅
│   │   ├── orders/                   ✅
│   │   ├── reports/                  ✅
│   │   ├── suppliers/                ✅
│   │   └── warehouses/               ✅
│   └── tests/
│       ├── api/
│       │   ├── test_api_auth.py           ✅ 4 tests
│       │   ├── test_api_customers.py      ✅ 14 tests
│       │   ├── test_api_permissions.py    ✅ 1 test
│       │   ├── test_api_reports.py        ✅ 3 tests
│       │   ├── test_api_stock.py          ✅ 7 tests
│       │   └── test_api_user_management.py ✅ 7 tests
│       └── domain/                        ✅ 47 tests
└── frontend/
    ├── vercel.json                   ✅ SPA rewrite rule
    └── src/
        ├── api/
        │   ├── auth.ts               ✅
        │   ├── client.ts             ✅ JWT interceptors + refresh
        │   ├── customers.ts          ✅
        │   ├── orders.ts             ✅
        │   ├── products.ts           ✅
        │   ├── reports.ts            ✅
        │   ├── suppliers.ts          ✅
        │   ├── userManagement.ts     ✅
        │   └── warehouses.ts         ✅
        ├── components/layout/        ✅ Sidebar, Navbar, PageLayout
        ├── hooks/
        │   ├── useAuth.ts            ✅
        │   └── useOrderStatusPolling.ts ✅
        ├── pages/
        │   ├── alerts/               ✅
        │   ├── auth/                 ✅
        │   ├── categories/           ✅
        │   ├── customers/            ✅
        │   ├── dashboard/            ✅ (low-stock warehouse name blank — deferred)
        │   ├── orders/               ✅ both purchase + sale, async polling
        │   ├── products/
        │   │   ├── ProductsPage.tsx  ✅ product name → Link to detail page
        │   │   └── ProductDetailPage.tsx ✅ — /products/:id
        │   ├── reports/              ⚠️ LowStockSection labels still Product #N — fix identified, not applied (Session 19)
        │   ├── stock/                ✅
        │   ├── suppliers/            ✅
        │   ├── users/
        │   │   └── UsersPage.tsx     ✅ admin-only /users
        │   └── warehouses/           ✅
        ├── routes/
        │   ├── AdminRoute.tsx        ✅
        │   └── ProtectedRoute.tsx    ✅
        ├── stores/authStore.tsx      ✅
        └── types/index.ts            ✅ User.is_active confirmed present (Session 19)
```

---

## 📊 Frontend Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Done | |
| Dashboard | ✅ Done | Low stock warehouse name blank — deliberately deferred |
| Products | ✅ Done | Name cells now link to detail page |
| Product Detail | ✅ Done | `/products/:id`, info card + transaction history |
| Categories | ✅ Done | |
| Warehouses | ✅ Done | |
| Suppliers | ✅ Done | |
| Customers | ✅ Done | Phone bug fixed Session 17/18 |
| Stock Transactions | ✅ Done | |
| Purchase Orders | ✅ Done | Async polling on Receive |
| Sale Orders | ✅ Done | Async polling on Ship; quick-create customer (browser verify still outstanding) |
| Low Stock Alerts | ✅ Done | Warehouse column blank — deliberately deferred |
| Reports | ⚠️ Open item | LowStockSection labels show `Product #N` — fix identified Session 19, not yet applied |
| User Management | ✅ Done | Admin-only; inline role dropdown; activate/deactivate; self-protection |
| Dark/light mode | 🆕 Tier 4 Item 3 — next to build | CSS vars already defined |

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access incl. stock adjust, user management (`/users`), customer edit/deactivate |
| Manager | `"manager"` | Warehouse + stock oversight, customer edit/deactivate; `is_staff=True` |
| Staff | `"staff"` | Orders, stock in/out, can create customers but not edit/deactivate |
| Customer | `"customer"` | Not a logged-in role; phone_number optional; records created via CustomerSerializer |

---

## ⚠️ Critical Pattern — Zod v4 + zodResolver

```tsx
// ✅ CORRECT — no generic on useForm
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
})
const onSubmit = handleSubmit((values) => { myMutation.mutate(values) })
```

---

## ⚠️ Local Dev Settings Module

`backend/manage.py` defaults to `config.settings.local`. `python manage.py runserver` (no env var needed) uses SQLite + `CORS_ALLOW_ALL_ORIGINS = True` + console email + eager Celery.

---

## 🎨 Established UI Patterns

| Pattern | Implementation |
|---|---|
| Empty optional field | `<span className="italic text-muted-foreground/50">—</span>` |
| Skeleton loading rows | `Array.from({ length: N }).map((_, i) => ...)` with animate-pulse |
| Search debounce | `let searchTimeout = 0` + `window.setTimeout(..., 400)` |
| Modal scroll | `max-h-[90vh] overflow-y-auto` on modal container |
| Action buttons | edit: `hover:bg-muted`, delete: `hover:bg-red-50 hover:text-red-500` |
| Primary button | `bg-foreground text-background hover:opacity-90` |
| Danger button | `bg-red-500 text-white hover:bg-red-600` |
| Dynamic form rows | `useFieldArray` from react-hook-form |
| Expandable table row | local `useState(false)` per row, `ChevronDown/Up` icon toggle |
| Stock type badge | IN=green-50/green-700, OUT=red-50/red-600, ADJ=blue-50/blue-700 |
| Order status badge | per-status config object mapping status → label + className |
| Severity bar | ratio-based width %, red/amber fill based on qty/reorder_level |
| Async action polling | `useOrderStatusPolling(fetchFn, listQueryKey)` hook |
| Soft-deactivate | `PATCH {is_active: false}` — never DELETE for PROTECT-FK entities |
| Inline quick-create | `+` button next to select → modal → `onCreated` callback → `setValue` |
| Admin-only route | `<Route element={<AdminRoute />}>` wrapping the route in App.tsx |
| Inline role edit | `<select>` directly in table row, `onChange` fires mutation immediately |
| Self-protection guard | Backend: `PermissionDenied` if `obj.pk == request.user.pk` on PATCH; Frontend: show shield icon, hide controls |
| Backend "low stock" | Always `quantity__lte=F('reorder_level')` against `Product.quantity` directly |
| LowStockAlert writes | Always `update_or_create`, never `get_or_create` |
| Uptime monitoring | External UptimeRobot HTTP(s) monitor against `GET /api/` (health_check view, no DB hit), 5-min interval — keeps Render free-tier backend warm (Session 19) |
| README structure | No "Architecture Highlights" deep-dive or unfilled "Screenshots" placeholder — owner prefers a leaner README; deep technical explanations live in `docs/` and get discussed live in the interview instead (Session 19 decision) |

---

## ⚙️ Local Dev Commands (PowerShell)

```powershell
# Backend
cd backend
pipenv shell
python manage.py runserver   # no env var needed, defaults to config.settings.local

# Frontend
cd frontend
npm run dev

# Tests
cd backend
pytest -v                              # full suite (83 tests)
pytest tests/api/test_api_user_management.py -v   # 7 tests
pytest tests/api/test_api_customers.py -v          # 14 tests
```

---

## ⚠️ Known Issues / Open Items

| Issue | Location | Priority |
|---|---|---|
| ReportsPage `LowStockSection` shows `Product #N` | `ReportsPage.tsx` | Low — one-line fix identified Session 19, not yet applied |
| Quick-create customer modal not manually verified in browser | `SaleOrdersPage.tsx` | HIGH — carried over from Session 15 |
| Warehouse column blank on Alerts/Dashboard | `AlertsPage.tsx`, `DashboardPage.tsx` | Deliberately deferred — do NOT fix unless asked |
| `useOrderStatusPolling` has no unmount cleanup | `useOrderStatusPolling.ts` | Low risk |
| Product picture storage | — | Blocked on Cloudinary vs base64 decision |
| Celery Beat in production | — | Blocked on second worker vs code-only decision |
| README needs real screenshots + demo login | `README.md` | Owner adding manually before interview |

*(`is_active` missing from `UserListSerializer`/`User` type — removed from this table. Verified already present in Session 19; no fix was needed.)*
*(Uptime Robot monitor — removed from this table. Configured in Session 19, pending owner confirmation of "Up" status.)*

---

## 📌 See Also

- `docs/NEXT_STEPS.md` — always the most current "what to do right now"
- `docs/PROJECT_PLAN.md` — Phase 6 tiered backlog
- `docs/PROJECT_SCOPE.md` — full in-scope/out-of-scope + open decisions table