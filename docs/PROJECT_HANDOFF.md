# 📦 Inventory Management System — Project Handoff

## What This Document Is
Complete handoff for continuing development of the IMS backend + React frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System
**Goal:** Portfolio project for fullstack developer interviews
**Stack:** Django + DRF (backend) + React + TypeScript (frontend, in progress)
**Live Backend:** https://inventory-management-system-uet9.onrender.com
**Swagger Docs:** https://inventory-management-system-uet9.onrender.com/swagger/
**Admin Panel:** https://inventory-management-system-uet9.onrender.com/admin/
**GitHub:** https://github.com/longreaksa404/inventory-management-system
**Frontend:** Not yet deployed (deploy to Vercel once more pages are built)

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
        │   ├── auth/
        │   │   └── LoginPage.tsx          ✅
        │   ├── dashboard/
        │   │   └── DashboardPage.tsx      ✅
        │   ├── products/
        │   │   └── ProductsPage.tsx       ✅
        │   ├── categories/
        │   │   └── CategoriesPage.tsx     ✅
        │   ├── warehouses/
        │   │   └── WarehousesPage.tsx     ✅
        │   └── suppliers/
        │       └── SuppliersPage.tsx      ✅
        ├── routes/
        │   └── ProtectedRoute.tsx  ✅
        ├── stores/
        │   └── authStore.tsx       ✅
        ├── types/
        │   └── index.ts            ✅
        ├── App.tsx                 ✅ all 6 pages wired, 5 ComingSoon remaining
        ├── App.css                 ✅
        ├── index.css               ✅
        └── main.tsx                ✅
```

---

## ✅ Session 1 — Backend Bug Fixes
## ✅ Session 2 — Infrastructure (Render deploy)
## ✅ Session 3 — CORS
## ✅ Session 4 — Deploy Fixes + Tests Green (50/50)
## ✅ Session 5 — Frontend Scaffolding + API Layer
## ✅ Session 6 — Auth Flow + Dashboard + Products Page

## ✅ Session 7 — Categories, Warehouses, Suppliers Pages

### Pages built
- `CategoriesPage.tsx` — full CRUD, modal form, delete confirmation, empty state with Tag icon, formatted created_at date
- `WarehousesPage.tsx` — full CRUD, code auto-uppercase with onChange, monospace badge for code column, scrollable modal (max-h-[90vh]), em dash for optional empty fields
- `SuppliersPage.tsx` — full CRUD, search with 400ms debounce (hits backend search= param), optional email validation, line-clamp-1 on address, context-aware empty state message

### App.tsx updates
- All three routes replaced from ComingSoon to lazy-loaded page components
- Remaining ComingSoon: suppliers ❌ (now done), orders/purchase, orders/sales, stock, alerts, reports

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
| Stock Transactions | ❌ Next |
| Purchase Orders | ❌ Todo |
| Sale Orders | ❌ Todo |
| Low Stock Alerts | ❌ Todo |
| Reports | ❌ Todo |

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access |
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

1. Dashboard low stock panel shows product/warehouse IDs — improve when alerts page is built
2. Frontend not deployed yet
3. CORS_ALLOWED_ORIGINS on Render needs real Vercel URL once deployed
4. Render free PostgreSQL expires July 16, 2026
5. Pipfile python_version 3.12 vs virtualenv 3.11.4 — harmless warning
6. Adjust stock is admin-only on backend — StockPage should hide/disable for non-admins