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
| Local dev | SQLite | `backend/db.sqlite3` (via `config.settings.local`, now the default) |
| Production | PostgreSQL | Supabase (Singapore, session pooler) |

**Supabase project ID:** `nducnhxvrzxdeucrijeu`
**Connection type:** Session Pooler (NOT Direct — Render is IPv4-only)

---

## 🗂️ Monorepo Structure (current + planned)

```
inventory-management-system/
├── backend/
│   ├── manage.py                     ✅ default settings module changed to config.settings.local (Session 13)
│   ├── apps/
│   │   ├── reports/views.py          ✅ LowStockReportView now reads Product.quantity directly (Session 13 fix)
│   │   ├── orders/models.py          ✅ SaleOrder.ship() uses update_or_create for LowStockAlert (Session 13 fix)
│   │   ├── accounts/views.py         🆕 planned: PATCH endpoint (Phase 6 Tier 4) — ?role= filter already done
│   │   └── ...
│   └── tests/
│       ├── api/test_api_reports.py                      🆕 new (Session 13)
│       └── domain/orders/test_low_stock_alert_refresh.py 🆕 new (Session 13)
└── frontend/
    ├── vercel.json                   ✅ SPA rewrite rule
    └── src/
        ├── api/                      ✅ all done
        ├── components/                ✅ all done
        ├── hooks/                     ✅
        ├── lib/                       ✅
        ├── pages/
        │   ├── auth/                  ✅
        │   ├── dashboard/              ✅ real product/warehouse names (low-stock warehouse now null — known/deferred)
        │   ├── products/               ✅ list/CRUD done; detail page 🆕 planned (Phase 6)
        │   ├── categories/             ✅
        │   ├── warehouses/             ✅
        │   ├── suppliers/               ✅
        │   ├── stock/                  ✅
        │   ├── orders/                 ✅ customer dropdown + price auto-fill appear ALREADY implemented — needs re-verification next session (Phase 6 Tier 2); async polling still planned (Tier 3)
        │   ├── alerts/                 ✅ Tier 1 bug fixed — accurate data now; warehouse column blank (known, deferred)
        │   ├── reports/                ✅ minor: LowStockSection labels still show Product #N
        │   └── users/                  🆕 planned (Phase 6 Tier 4)
        ├── routes/                     ✅
        ├── stores/                     ✅
        ├── types/                      ✅ (LowStockItem warehouse fields still typed non-nullable — mismatch with actual API response, deferred per user decision)
        └── App.tsx                     ✅ will need new /users and /products/:id routes
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
- **Session 11** — Fixed Product #N / Warehouse #N display: updated LowStockReportView (backend), LowStockItem type, AlertsPage, DashboardPage
- **Session 12** — Reviewed and prioritized full new backlog (10 items). Updated PROJECT_SCOPE.md and PROJECT_PLAN.md (new Phase 6). Planning only, no code changes.
- **Session 13** — **Tier 1 complete.** Diagnosed and fixed two distinct low-stock alert bugs: (1) `LowStockReportView` was computing stock from purchase/sale order item sums instead of `Product.quantity`, causing wrong/missing alerts for any product whose stock moved via Stock In/Out/Adjust; rewrote to query `Product.quantity__lte=reorder_level` directly. (2) `SaleOrder.ship()` used `get_or_create` for `LowStockAlert`, freezing alert data at first trigger; changed to `update_or_create`. Added 4 new tests, all 53+ passing. Also fixed local dev CORS issue by changing `manage.py`'s default settings module from `development` to `local` (production unaffected — protected by Render's explicit env var + `wsgi.py`'s separate default). Verified fix live on `/alerts` page. User explicitly decided NOT to fix the resulting blank Warehouse column — deferred.

---

## 📊 Frontend Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Done | |
| Dashboard | ✅ Done | Low stock panel — warehouse name now blank (known/deferred, Session 13) |
| Products | ✅ Done | Detail page planned (Phase 6) |
| Categories | ✅ Done | |
| Warehouses | ✅ Done | |
| Suppliers | ✅ Done | |
| Stock Transactions | ✅ Done | |
| Purchase Orders | ✅ Done | Async polling planned (Phase 6 Tier 3) |
| Sale Orders | ✅ Done | Customer dropdown + price auto-fill appear already implemented — re-verify next session |
| Low Stock Alerts | ✅ Done (display), ✅ Done (backend accuracy, Session 13) | Warehouse column blank — known/deferred |
| Reports | ✅ Done | Minor: LowStockSection labels still show Product #N |
| User management | 🆕 Planned | Phase 6 Tier 4 |
| Product detail | 🆕 Planned | Phase 6 Tier 4 |

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access incl. stock adjust, planned: user management |
| Manager | `"manager"` | Warehouse + stock oversight |
| Staff | `"staff"` | Orders, stock in/out |
| Customer | `"customer"` | Sales orders only — listable via `?role=customer` filter (already implemented) |

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

## ⚠️ Local Dev Settings Module (Session 13 change)

`backend/manage.py` now defaults to `config.settings.local` (was `config.settings.development`). This means:
- `python manage.py runserver` (no env var needed) now uses SQLite + `CORS_ALLOW_ALL_ORIGINS = True` + console email + eager Celery — correct for daily frontend+backend local work.
- If you specifically need `config.settings.development` (e.g. testing against local Postgres/Redis), you must now explicitly set: `$env:DJANGO_SETTINGS_MODULE="config.settings.development"` before running the command.
- **Production is NOT affected.** Render sets `DJANGO_SETTINGS_MODULE=config.settings.production` explicitly (`render.yaml`), and `config/wsgi.py` has its own separate hardcoded default of `config.settings.production` — gunicorn never touches `manage.py`'s default at all.

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
| Display-only derived ID | `CT${String(id).padStart(4, '0')}` — already implemented in SaleOrdersPage |
| Polling after async action | refetch every 2s for ~15s post-202, or until status changes (planned, Phase 6 Tier 3) |
| Backend "low stock" check | Always `quantity__lte=F('reorder_level')` against `Product.quantity` directly — never derive from order-item sums (Session 13 lesson) |
| LowStockAlert writes | Always `update_or_create`, never `get_or_create` — alert data must refresh as stock changes (Session 13 lesson) |

---

## ⚙️ Local Dev Commands (PowerShell)

```powershell
# Backend (no env var needed as of Session 13)
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
2. Blank "Warehouse" column on Low Stock Alerts/Dashboard — known side effect of Session 13 fix, **explicitly deferred per user decision, do not fix unless asked**
3. ReportsPage `LowStockSection` bar labels still show `Product #N` — one-line fix, low priority
4. Sale Order customer dropdown + price auto-fill — code appears complete, needs browser re-verification next session (Phase 6 Tier 2)
5. Two decisions blocking Tier 5 items: product picture storage (Cloudinary vs base64), Celery Beat production deployment (second worker vs code-only)
6. README still needs full portfolio polish (screenshots, live URLs, tech badges, local dev section)

---

## 📌 See Also

- `docs/PROJECT_SCOPE.md` — full in-scope/out-of-scope list including backlog items and "Open Decisions" table
- `docs/PROJECT_PLAN.md` — Phase 6 has the tiered backlog breakdown
- `docs/NEXT_STEPS.md` — session-by-session action items, always the most current "what to do right now"