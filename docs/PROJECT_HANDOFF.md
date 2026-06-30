# 📦 Inventory Management System — Project Handoff

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

## 🗂️ Monorepo Structure (current + planned)

```
inventory-management-system/
├── backend/
│   ├── manage.py                     ✅ default settings module is config.settings.local
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── views.py              ✅ + CustomerListCreateView, CustomerDetailView (Session 15)
│   │   │   ├── serializers.py        ✅ + CustomerSerializer (Session 15)
│   │   │   ├── permissions.py        ✅ NEW (Session 15) — CustomerPermission
│   │   │   └── urls.py               ✅ + /accounts/customers/, /accounts/customers/{id}/
│   │   ├── reports/views.py          ✅ LowStockReportView reads Product.quantity directly
│   │   ├── orders/models.py          ✅ SaleOrder.ship() uses update_or_create for LowStockAlert
│   │   └── ...
│   └── tests/
│       ├── api/test_api_reports.py
│       ├── api/test_api_customers.py 🆕 PLANNED (Session 15 follow-up) — not written yet
│       └── domain/orders/test_low_stock_alert_refresh.py
└── frontend/
    ├── vercel.json                   ✅ SPA rewrite rule
    └── src/
        ├── api/
        │   ├── customers.ts          ✅ NEW (Session 15)
        │   └── ... (rest done)
        ├── components/                ✅ all done
        ├── hooks/
        │   ├── useAuth.ts             ✅
        │   └── useOrderStatusPolling.ts  ✅ (Session 14) — generic polling hook for async Ship/Receive
        ├── lib/                       ✅
        ├── pages/
        │   ├── auth/                  ✅
        │   ├── dashboard/              ✅ low-stock warehouse name still blank (known/deferred)
        │   ├── products/               ✅ list/CRUD done; detail page 🆕 planned (Phase 6 Tier 4)
        │   ├── categories/             ✅
        │   ├── warehouses/             ✅
        │   ├── suppliers/               ✅
        │   ├── customers/               ✅ NEW (Session 15) — CustomersPage.tsx, exports CustomerForm for reuse
        │   ├── stock/                  ✅
        │   ├── orders/                 ✅ Tier 3 polling done; Tier 2 dropdown UX done; Sale Order form now has inline "+ New customer" quick-create (Session 15)
        │   ├── alerts/                 ✅ Tier 1 bug fixed — accurate data; warehouse column blank (known, deferred)
        │   ├── reports/                ✅ minor: LowStockSection labels still show Product #N
        │   └── users/                  🆕 planned (Phase 6 Tier 4) — admin user mgmt, NOT the same as customers/
        ├── routes/                     ✅
        ├── stores/                     ✅
        ├── types/                      ✅ + Customer, CustomerPayload (Session 15)
        └── App.tsx                     ✅ + /customers route (Session 15); /users and /products/:id still planned
```

---

## ✅ Session History

- **Session 1** — Backend bug fixes
- **Session 2** — Infrastructure (Render deploy)
- **Session 3** — CORS
- **Session 4** — Deploy fixes + tests green (50/50)
- **Session 5** — Frontend scaffolding + API layer
- **Session 6** — Auth flow + Dashboard + Products page
- **Session 7** — Categories, Warehouses, Suppliers pages
- **Session 8** — Stock, PurchaseOrders, SaleOrders, Alerts, Reports pages + App.tsx wired
- **Session 9** — Fixed Render Root Directory, migrated DB to Supabase, set up DBeaver
- **Session 10** — Deployed frontend to Vercel, added vercel.json SPA fix, deleted old Render PostgreSQL
- **Session 11** — Fixed Product #N / Warehouse #N display: updated LowStockReportView, LowStockItem type, AlertsPage, DashboardPage
- **Session 12** — Reviewed and prioritized full backlog (10 items). Updated PROJECT_SCOPE.md and PROJECT_PLAN.md (new Phase 6). Planning only.
- **Session 13** — Tier 1 complete: fixed two distinct low-stock alert bugs (LowStockReportView computing from order items instead of Product.quantity; SaleOrder.ship() using get_or_create instead of update_or_create). Added 4 tests. Fixed local dev CORS by changing manage.py default to config.settings.local.
- **Session 14** — Tier 3 complete: built `useOrderStatusPolling` hook, wired into `PurchaseOrdersPage.tsx` (receive) and `SaleOrdersPage.tsx` (ship), both with a "Processing…" spinner badge during polling. No backend changes required.
- **Session 15** — **Tier 2 finalized + new Customer management feature built.** Tier 2: verified price auto-fill correct as-is; changed customer dropdown label from internal `CT00XX` ID to name + phone (`{first_name} {last_name} ({phone_number})`). While verifying this, discovered there was no way to create a customer anywhere in the app — built a full fix: backend `CustomerSerializer`/`CustomerListCreateView`/`CustomerDetailView`/`CustomerPermission` (staff can create/list, admin/manager can edit/deactivate, no hard delete since `SaleOrder.customer` is `PROTECT`); frontend `CustomersPage.tsx` (full management page, reused on `/customers`) plus an inline "+ New customer" quick-create modal directly in the Sale Order form. **No test coverage added yet — flagged as the required next step before Tier 4.**

---

## 📊 Frontend Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Done | |
| Dashboard | ✅ Done | Low stock panel — warehouse name blank (known/deferred) |
| Products | ✅ Done | Detail page planned (Phase 6) |
| Categories | ✅ Done | |
| Warehouses | ✅ Done | |
| Suppliers | ✅ Done | |
| **Customers** | **✅ Done (Session 15)** | **New page — search, create, edit, active/inactive toggle (no hard delete)** |
| Stock Transactions | ✅ Done | |
| Purchase Orders | ✅ Done | Async polling on Receive |
| Sale Orders | ✅ Done | Async polling on Ship; customer dropdown shows name+phone; inline customer quick-create (Session 15) |
| Low Stock Alerts | ✅ Done | Warehouse column blank — known/deferred |
| Reports | ✅ Done | Minor: LowStockSection labels still show Product #N |
| User management | 🆕 Planned | Phase 6 Tier 4 — admin-only role/active management, distinct from Customers page |
| Product detail | 🆕 Planned | Phase 6 Tier 4 |

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access incl. stock adjust, customer edit/deactivate, planned: user management |
| Manager | `"manager"` | Warehouse + stock oversight, customer edit/deactivate |
| Staff | `"staff"` | Orders, stock in/out, **can create customers but not edit/deactivate them** |
| Customer | `"customer"` | Not a logged-in role in practice — customer records have unusable passwords (created via `CustomerSerializer`, never log in) |

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

`backend/manage.py` defaults to `config.settings.local`. `python manage.py runserver` (no env var needed) uses SQLite + `CORS_ALLOW_ALL_ORIGINS = True` + console email + eager Celery. For `config.settings.development` (e.g. local Postgres/Redis), explicitly set `$env:DJANGO_SETTINGS_MODULE="config.settings.development"`. Production is unaffected — Render sets `DJANGO_SETTINGS_MODULE=config.settings.production` explicitly via `render.yaml`, and `wsgi.py` has its own separate hardcoded default.

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
| Truncating name cells | `min-w-0 flex-1 truncate` on the text container |
| Async action polling | `useOrderStatusPolling(fetchFn, listQueryKey)` hook — `startPolling(id, initialStatus)` after a 202 response; 2s interval, 15s timeout; row renders a spinner badge via `pollingIds.has(id)` while in flight |
| **Soft-deactivate instead of delete** | **`PATCH {is_active: false}` for entities referenced by `PROTECT` FKs (e.g. customers referenced by SaleOrder) — never expose a DELETE endpoint that would just 500 (Session 15)** |
| **Inline quick-create from a parent form** | **A small "+" button next to a `<select>` opens the same form component used by the full management page, in a modal; `onCreated` callback both invalidates the relevant list query and `setValue`s the new id into the parent form (Session 15, Sale Order → Customer)** |
| Backend "low stock" check | Always `quantity__lte=F('reorder_level')` against `Product.quantity` directly — never derive from order-item sums |
| LowStockAlert writes | Always `update_or_create`, never `get_or_create` |

---

## ⚙️ Local Dev Commands (PowerShell)

```powershell
# Backend (no env var needed)
cd backend
pipenv shell
python manage.py runserver

# Frontend
cd frontend
npm run dev

# Backend: http://127.0.0.1:8000
# Frontend: http://localhost:5173
```

---

## ⚠️ Known Issues / Open Items

1. ~~Low stock alert not triggering correctly~~ — ✅ FIXED Session 13
2. Blank "Warehouse" column on Low Stock Alerts/Dashboard — known side effect, **explicitly deferred per user decision, do not fix unless asked**
3. ReportsPage `LowStockSection` bar labels still show `Product #N` — one-line fix, low priority
4. `useOrderStatusPolling` has no cleanup on component unmount — low risk, optional follow-up if reused elsewhere
5. **New customer endpoints (`/accounts/customers/`) and `CustomersPage.tsx` have zero test coverage — write `tests/api/test_api_customers.py` before starting Tier 4 (Session 15)**
6. Customer list/dropdown paginated at 50 like all list endpoints — fine now, revisit if customer count grows
7. Two decisions blocking Tier 5 items: product picture storage (Cloudinary vs base64), Celery Beat production deployment (second worker vs code-only)
8. README still needs full portfolio polish (screenshots, live URLs, tech badges, local dev section)

---

## 📌 See Also

- `docs/PROJECT_SCOPE.md` — full in-scope/out-of-scope list including backlog items and "Open Decisions" table. **Should be updated to add Customer management to In Scope — not yet done as of Session 15.**
- `docs/PROJECT_PLAN.md` — Phase 6 has the tiered backlog breakdown. **Same note — Customer management isn't reflected there yet since it wasn't originally planned.**
- `docs/NEXT_STEPS.md` — session-by-session action items, always the most current "what to do right now"