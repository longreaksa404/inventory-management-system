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
| Local dev | SQLite | `backend/db.sqlite3` |
| Production | PostgreSQL | Supabase (Singapore, session pooler) |

**Supabase project ID:** `nducnhxvrzxdeucrijeu`
**Supabase dashboard:** https://supabase.com/dashboard/project/nducnhxvrzxdeucrijeu
**Connection type:** Session Pooler (NOT Direct — Render is IPv4-only)
**Old Render PostgreSQL:** DELETED (was `inventory-db`, deleted Session 10)

---

## 🗂️ Monorepo Structure

```
inventory-management-system/
├── backend/                          ← Django + DRF (fully built + deployed on Render)
│   ├── build.sh                      ← Render build script (Root Directory = "backend")
│   └── ...
└── frontend/
    ├── vercel.json                   ✅ SPA rewrite rule for React Router
    └── src/
        ├── api/
        │   ├── client.ts             ✅ Axios + JWT interceptors
        │   ├── auth.ts               ✅
        │   ├── products.ts           ✅
        │   ├── warehouses.ts         ✅
        │   ├── suppliers.ts          ✅
        │   ├── orders.ts             ✅
        │   └── reports.ts            ✅
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx       ✅
        │   │   ├── Navbar.tsx        ✅
        │   │   └── PageLayout.tsx    ✅
        │   └── ui/
        │       └── button.tsx        ✅
        ├── hooks/
        │   └── useAuth.ts            ✅
        ├── lib/
        │   └── utils.ts              ✅
        ├── pages/
        │   ├── auth/LoginPage.tsx              ✅
        │   ├── dashboard/DashboardPage.tsx     ✅ (shows Product #N — needs name fix)
        │   ├── products/ProductsPage.tsx       ✅
        │   ├── categories/CategoriesPage.tsx   ✅
        │   ├── warehouses/WarehousesPage.tsx   ✅
        │   ├── suppliers/SuppliersPage.tsx     ✅
        │   ├── stock/StockPage.tsx             ✅
        │   ├── orders/PurchaseOrdersPage.tsx   ✅
        │   ├── orders/SaleOrdersPage.tsx       ✅
        │   ├── alerts/AlertsPage.tsx           ✅ (shows Product #N — needs name fix)
        │   └── reports/ReportsPage.tsx         ✅
        ├── routes/ProtectedRoute.tsx           ✅
        ├── stores/authStore.tsx                ✅
        ├── types/index.ts                      ✅
        ├── App.tsx                             ✅ all 10 routes wired
        ├── App.css                             ✅
        ├── index.css                           ✅
        └── main.tsx                            ✅ (sonner installed, NOT yet wired)
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
- **Session 10** — Deployed frontend to Vercel, added vercel.json SPA fix, installed sonner, deleted old Render PostgreSQL

---

## 📊 Frontend Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Done | |
| Dashboard | ✅ Done | Low stock panel shows Product #N / Warehouse #N |
| Products | ✅ Done | |
| Categories | ✅ Done | |
| Warehouses | ✅ Done | |
| Suppliers | ✅ Done | |
| Stock Transactions | ✅ Done | |
| Purchase Orders | ✅ Done | |
| Sale Orders | ✅ Done | |
| Low Stock Alerts | ✅ Done | Shows Product #N / Warehouse #N |
| Reports | ✅ Done | |

---

## 📦 Installed Packages (not yet wired)

| Package | Status | Notes |
|---|---|---|
| `sonner` | Installed, NOT wired | Add Toaster to main.tsx, toast calls to all mutation pages |

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access incl. stock adjust |
| Manager | `"manager"` | Warehouse + stock oversight |
| Staff | `"staff"` | Orders, stock in/out |
| Customer | `"customer"` | Sales orders only |

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
| Toast success | `toast.success("Action done")` from sonner |
| Toast error | `toast.error("Something went wrong.")` from sonner |

---

## ⚙️ Local Dev Commands (PowerShell)

```powershell
# Backend
cd backend
pipenv shell
$env:DJANGO_SETTINGS_MODULE="config.settings.local"
python manage.py runserver

# Frontend
cd frontend
npm run dev

# Backend: http://127.0.0.1:8000
# Frontend: http://localhost:5173
```

---

## ⚠️ Known Issues

1. Dashboard low stock panel shows `Product #N` / `Warehouse #N` — needs name join
2. AlertsPage shows `Product #N` / `Warehouse #N` — same issue, `/reports/low-stock/` returns raw IDs
3. SaleOrder create form uses raw numeric customer ID field — poor UX, low priority
4. `sonner` installed but not wired into main.tsx or any page yet
5. README needs live URL, screenshots, and tech stack section