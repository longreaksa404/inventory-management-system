# 📦 Inventory Management System — Project Handoff

## What This Document Is
Complete handoff for continuing development of the IMS backend + React frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System
**Goal:** Portfolio project for fullstack developer interviews
**Stack:** Django + DRF (backend) + React + TypeScript (frontend)
**Live Backend:** https://inventory-management-system-uet9.onrender.com
**Swagger Docs:** https://inventory-management-system-uet9.onrender.com/swagger/
**Admin Panel:** https://inventory-management-system-uet9.onrender.com/admin/
**GitHub:** https://github.com/longreaksa404/inventory-management-system
**Frontend:** Not yet deployed — deploy to Vercel next session

---

## 🗂️ Monorepo Structure

```
inventory-management-system/
├── backend/                          ← Django + DRF (fully built + deployed)
└── frontend/
    └── src/
        ├── api/
        │   ├── client.ts         ✅ Axios + JWT interceptors
        │   ├── auth.ts           ✅
        │   ├── products.ts       ✅ products, categories, stock mutations
        │   ├── warehouses.ts     ✅
        │   ├── suppliers.ts      ✅
        │   ├── orders.ts         ✅ purchase + sale order lifecycle
        │   └── reports.ts        ✅
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx   ✅
        │   │   ├── Navbar.tsx    ✅
        │   │   └── PageLayout.tsx ✅
        │   └── ui/
        │       └── button.tsx    ✅
        ├── hooks/
        │   └── useAuth.ts        ✅
        ├── lib/
        │   └── utils.ts          ✅
        ├── pages/
        │   ├── auth/LoginPage.tsx              ✅
        │   ├── dashboard/DashboardPage.tsx     ✅
        │   ├── products/ProductsPage.tsx       ✅
        │   ├── categories/CategoriesPage.tsx   ✅
        │   ├── warehouses/WarehousesPage.tsx   ✅
        │   ├── suppliers/SuppliersPage.tsx     ✅
        │   ├── stock/StockPage.tsx             ✅ NEW
        │   ├── orders/PurchaseOrdersPage.tsx   ✅ NEW
        │   ├── orders/SaleOrdersPage.tsx       ✅ NEW
        │   ├── alerts/AlertsPage.tsx           ✅ NEW
        │   └── reports/ReportsPage.tsx         ✅ NEW
        ├── routes/ProtectedRoute.tsx  ✅
        ├── stores/authStore.tsx       ✅
        ├── types/index.ts             ✅
        ├── App.tsx                    ✅ all 10 routes wired
        ├── App.css                    ✅
        ├── index.css                  ✅
        └── main.tsx                   ✅
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

---

## 📊 Frontend Pages Status

| Page | Status |
|---|---|
| Login | ✅ Done |
| Dashboard | ✅ Done |
| Products | ✅ Done |
| Categories | ✅ Done |
| Warehouses | ✅ Done |
| Suppliers | ✅ Done |
| Stock Transactions | ✅ Done |
| Purchase Orders | ✅ Done |
| Sale Orders | ✅ Done |
| Low Stock Alerts | ✅ Done |
| Reports | ✅ Done |

**MVP is feature-complete. Next step: deploy + polish.**

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
| Empty optional field in table | `<span className="italic text-muted-foreground/50">—</span>` |
| Skeleton loading rows | `Array.from({ length: N }).map((_, i) => ...)` with animate-pulse divs |
| Search debounce | `let searchTimeout = 0` + `window.setTimeout(..., 400)` |
| Modal scroll | `max-h-[90vh] overflow-y-auto` on modal container |
| Action buttons row | edit: `hover:bg-muted`, delete: `hover:bg-red-50 hover:text-red-500` |
| Primary button | `bg-foreground text-background hover:opacity-90` |
| Danger button | `bg-red-500 text-white hover:bg-red-600` |
| Dynamic form rows | `useFieldArray` from react-hook-form |
| Expandable table row | local `useState(false)` per row, `ChevronDown/Up` icon toggle |
| Stock type badge | IN=green-50/green-700, OUT=red-50/red-600, ADJ=blue-50/blue-700 |
| Order status badge | per-status config object mapping status → label + className |
| Severity bar | ratio-based width %, red/amber fill based on qty/reorder_level |

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

1. Dashboard low stock panel shows `Product #N` / `Warehouse #N` IDs — needs name join or link to AlertsPage
2. Frontend not deployed yet — deploy to Vercel next
3. `CORS_ALLOWED_ORIGINS` on Render needs real Vercel URL after deploy
4. Render free PostgreSQL expires July 16, 2026
5. Pipfile python_version 3.12 vs virtualenv 3.11.4 — harmless
6. AlertsPage shows `Product #N` / `Warehouse #N` IDs — the `/reports/low-stock/` API endpoint returns raw IDs, not names. Fix by either: (a) changing the backend view to join product/warehouse names, or (b) fetching all products/warehouses client-side and doing a lookup map
7. SaleOrder create form uses a numeric customer ID field — ideally this should be a user search/select for better UX, but requires a customer list API endpoint