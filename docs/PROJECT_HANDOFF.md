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
│   │   │   ├── models.py             ⚠️ CustomUserManager.create_user() has a known phone_number bug for customer role — fix written (Session 17), not yet applied
│   │   │   ├── views.py              ✅ + CustomerListCreateView, CustomerDetailView (Session 15)
│   │   │   ├── serializers.py        ✅ + CustomerSerializer (Session 15)
│   │   │   ├── permissions.py        ✅ CustomerPermission (Session 15)
│   │   │   └── urls.py               ✅ + /accounts/customers/, /accounts/customers/{id}/
│   │   ├── reports/views.py          ✅ LowStockReportView reads Product.quantity directly
│   │   ├── orders/models.py          ✅ SaleOrder.ship() uses update_or_create for LowStockAlert
│   │   └── ...
│   └── tests/
│       ├── api/test_api_reports.py
│       ├── api/test_api_customers.py ✅ (Session 16) — 14 tests; 9 passed / 5 failed on first run against live repo (Session 17), all 5 traced to the same real bug, not test bugs
│       └── domain/orders/test_low_stock_alert_refresh.py
└── frontend/
    ├── vercel.json                   ✅ SPA rewrite rule
    └── src/
        ├── api/
        │   ├── customers.ts          ✅ (Session 15)
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
        │   ├── customers/               ✅ (Session 15) — CustomersPage.tsx, exports CustomerForm for reuse; backend test-covered (Session 16), bug found in that path (Session 17, fix pending)
        │   ├── stock/                  ✅
        │   ├── orders/                 ✅ Tier 3 polling done; Tier 2 dropdown UX done; Sale Order form has inline "+ New customer" quick-create (Session 15) — this is the form that would have hit the phone_number bug found Session 17; still needs manual browser verification
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

- **Session 17** — **Ran the new Customer test suite against the live repo and found a real bug.** Result: 68 passed, 5 failed across the full backend suite (all 5 failures isolated to `test_api_customers.py`). Root cause: `CustomUserManager.create_user()` in `apps/accounts/models.py` unconditionally requires a `phone_number` for any non-superuser account — a guard that predates the Customer feature (Session 15) and was never updated to account for it. `CustomerSerializer` treats `phone_number` as optional (the `CustomUser` model field is `blank=True, default=''`), and customer records never log in, so there's no real reason to enforce a phone for them. Net effect: **creating a customer without a phone number returns an unhandled 500**, not a clean validation error — and the Sale Order "+ New customer" quick-create form (`SaleOrdersPage.tsx`) doesn't require a phone, so this is a real bug that would hit actual users, not just a test artifact. Fix delivered as `backend/apps/accounts/models_create_user_patch.py`: exempt `role == 'customer'` from the phone requirement the same way `is_superuser` already is. **Not yet applied to the live repo file** — next session must paste the patched method in, re-run the suite (expect 73/73), and only then proceed to the still-outstanding manual browser verification of the quick-create flow.
- **Session 16** — Wrote `backend/tests/api/test_api_customers.py` covering create, list, and update permission/behavior for the Customer endpoints. Not run against the live repo in that session — deferred to Session 17, where the failures above were found.
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
- **Session 15** — Tier 2 finalized + new Customer management feature built: backend `CustomerSerializer`/`CustomerListCreateView`/`CustomerDetailView`/`CustomerPermission`; frontend `CustomersPage.tsx` plus inline "+ New customer" quick-create modal in the Sale Order form. No test coverage added in this session.

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
| Customers | ✅ Done (Session 15) | Search, create, edit, active/inactive toggle. Backend test-covered (Session 16); phone_number bug found in this path Session 17, fix written but not yet applied. |
| Stock Transactions | ✅ Done | |
| Purchase Orders | ✅ Done | Async polling on Receive |
| Sale Orders | ✅ Done | Async polling on Ship; customer dropdown shows name+phone; inline customer quick-create (Session 15) — **this form doesn't require a phone, so it's the exact path affected by the Session 17 bug; manual browser verification still outstanding** |
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
| Customer | `"customer"` | Not a logged-in role in practice — customer records have unusable passwords (created via `CustomerSerializer`, never log in). Phone number is optional for this role (fix pending, see Session 17). |

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
| Soft-deactivate instead of delete | `PATCH {is_active: false}` for entities referenced by `PROTECT` FKs (e.g. customers referenced by SaleOrder) — never expose a DELETE endpoint that would just 500 (Session 15); explicitly tested that no DELETE route exists (Session 16) |
| Inline quick-create from a parent form | A small "+" button next to a `<select>` opens the same form component used by the full management page, in a modal; `onCreated` callback both invalidates the relevant list query and `setValue`s the new id into the parent form (Session 15, Sale Order → Customer) |
| Backend "low stock" check | Always `quantity__lte=F('reorder_level')` against `Product.quantity` directly — never derive from order-item sums |
| LowStockAlert writes | Always `update_or_create`, never `get_or_create` |
| Permission test pattern for staff-create / admin-edit endpoints | Test create with the lowest-privileged allowed role (e.g. `staff_user`), test edit/delete restriction with that same low-privileged role expecting 403, then confirm with `admin_user`/`manager_user` that the privileged path succeeds (Session 16, `test_api_customers.py`) |
| Optional-field guards must match across model, serializer, and manager | A field marked optional in one layer (e.g. `blank=True` on the model, no `required` override in the serializer) must be checked for matching enforcement everywhere it's actually created — a stricter guard buried in a manager/service method (like `CustomUserManager.create_user()`) can silently override a more permissive schema and only surface as a 500 under real-world input (Session 17 finding) |

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

# Run the customer test file specifically
cd backend
pytest tests/api/test_api_customers.py -v
```

---

## ⚠️ Known Issues / Open Items

1. ~~Low stock alert not triggering correctly~~ — ✅ FIXED Session 13
2. Blank "Warehouse" column on Low Stock Alerts/Dashboard — known side effect, **explicitly deferred per user decision, do not fix unless asked**
3. ReportsPage `LowStockSection` bar labels still show `Product #N` — one-line fix, low priority
4. `useOrderStatusPolling` has no cleanup on component unmount — low risk, optional follow-up if reused elsewhere
5. **Customer creation without a phone number returns a 500** — `apps/accounts/models.py` `CustomUserManager.create_user()`. Found Session 17 via the test suite; this is a real bug, not just missing test coverage. Fix written at `backend/apps/accounts/models_create_user_patch.py`, **not yet applied to the live repo** — apply it, then re-run `pytest tests/api/test_api_customers.py -v` to confirm 14/14 pass.
6. **Sale Order quick-create-customer modal flow has not been manually verified end-to-end in the browser** — carried over from Session 15/16, now higher priority since item 5 above directly affects this exact flow.
7. Customer list/dropdown paginated at 50 like all list endpoints — fine now, revisit if customer count grows.
8. Two decisions blocking Tier 5 items: product picture storage (Cloudinary vs base64), Celery Beat production deployment (second worker vs code-only).
9. README still needs full portfolio polish (screenshots, live URLs, tech badges, local dev section).

---

## 📌 See Also

- `docs/PROJECT_SCOPE.md` — full in-scope/out-of-scope list including backlog items and "Open Decisions" table. **Should be updated to add Customer management to In Scope — not yet done.**
- `docs/PROJECT_PLAN.md` — Phase 6 has the tiered backlog breakdown. **Same note — Customer management isn't reflected there yet since it wasn't originally planned.**
- `docs/NEXT_STEPS.md` — session-by-session action items, always the most current "what to do right now"