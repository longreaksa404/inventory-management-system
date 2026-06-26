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
**Frontend:** Not yet deployed (deploy to Vercel once more pages are built)

---

## 🗂️ Monorepo Structure

```
inventory-management-system/
├── backend/                          ← Django + DRF (fully built + deployed)
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
│   ├── render.yaml
│   └── Dockerfile
└── frontend/                         ← React app (in progress)
    ├── src/
    │   ├── api/                  ✅ all API files written
    │   │   ├── client.ts         ✅ Axios + JWT interceptors (type imports fixed)
    │   │   ├── auth.ts           ✅ login, profile, change-password
    │   │   ├── products.ts       ✅ products, categories, stock mutations
    │   │   ├── warehouses.ts     ✅ warehouse CRUD
    │   │   ├── suppliers.ts      ✅ supplier CRUD
    │   │   ├── orders.ts         ✅ purchase + sale order lifecycle
    │   │   └── reports.ts        ✅ all report endpoints
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.tsx   ✅ dark sidebar, role-based nav
    │   │   │   ├── Navbar.tsx    ✅ top bar
    │   │   │   └── PageLayout.tsx ✅ Outlet shell wrapper
    │   │   └── ui/
    │   │       └── button.tsx    ✅ shadcn button
    │   ├── hooks/
    │   │   └── useAuth.ts        ✅ isAdmin, isManager, displayName helpers
    │   ├── lib/
    │   │   └── utils.ts          ✅ cn() utility
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   └── LoginPage.tsx          ✅ Done
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.tsx      ✅ Done
    │   │   └── products/
    │   │       └── ProductsPage.tsx       ✅ Done
    │   ├── routes/
    │   │   └── ProtectedRoute.tsx  ✅ hydration guard
    │   ├── stores/
    │   │   └── authStore.tsx       ✅ Context + useReducer
    │   ├── types/
    │   │   └── index.ts            ✅ all TypeScript interfaces
    │   ├── App.tsx                 ✅ lazy routes, ComingSoon placeholders
    │   ├── App.css                 ✅ Tailwind directives
    │   ├── index.css               ✅ Tailwind + CSS variables
    │   └── main.tsx                ✅ QueryClient + Router + AuthProvider
    ├── .env                        ✅ VITE_API_URL=http://127.0.0.1:8000
    ├── components.json             ✅ shadcn config
    ├── tailwind.config.js          ✅ Tailwind v3 + shadcn tokens
    ├── vite.config.ts              ✅ path alias @/ → src/
    └── package.json

```

---

## ✅ Session 1 — Backend Bug Fixes (33 issues across 30 files)
All backend bugs fixed. See original PROJECT_HANDOFF.md for full list.

## ✅ Session 2 — Infrastructure
Repo renamed, Render web service + PostgreSQL created, build.sh fixed.

## ✅ Session 3 — CORS
django-cors-headers added and configured for all environments.

## ✅ Session 4 — Deploy Fixes + Tests Green
50/50 tests passing. Backend live on Render.

## ✅ Session 5 — Frontend Scaffolding + API Layer
React + Vite + TypeScript scaffolded. All API files and TypeScript types written.

## ✅ Session 6 — Auth Flow + Dashboard + Products Page

### Auth flow
- `authStore.tsx` — Context + useReducer, JWT hydration on page refresh
- `useAuth.ts` — isAdmin, isManager, isStaff, hasRole, displayName helpers
- `main.tsx` — QueryClient → BrowserRouter → AuthProvider → App
- `App.tsx` — lazy-loaded routes, ComingSoon placeholders
- `ProtectedRoute.tsx` — hydration guard, redirect-after-login state
- `LoginPage.tsx` — Zod validation, 401 vs 5xx error handling

### Layout shell
- `Sidebar.tsx` — dark sidebar (#0f1117), role-based nav groups
- `Navbar.tsx` — top bar
- `PageLayout.tsx` — Outlet wrapper

### Pages built
- `DashboardPage.tsx` — 6 parallel React Query calls, KPI cards with icons,
  inventory value bar chart, low stock alerts panel, date chip
- `ProductsPage.tsx` — paginated table, search with 400ms debounce,
  category + status filters, create/edit modal, delete confirmation,
  color-coded stock badges (green/amber/red), skeleton loading rows

### Bugs fixed during session
- `axios InternalAxiosRequestConfig` must be type-only import
- `authStore` must be `.tsx` not `.ts` (contains JSX)
- Zod v4 + zodResolver type incompatibility — fixed by removing generic
  from `useForm` and using `handleSubmit((values) => ...)` pattern

---

## 🔐 Role System

| Role | Stored Value | Access Level |
|---|---|---|
| Admin | `"admin"` | Full access |
| Manager | `"manager"` | Warehouse + stock oversight |
| Staff | `"staff"` | Orders, stock in/out |
| Customer | `"customer"` | Sales orders only |

**Always compare against lowercase stored values.**

---

## 📊 Frontend Pages Status

| Page | Status |
|---|---|
| Login | ✅ Done |
| Dashboard | ✅ Done |
| Products | ✅ Done |
| Categories | ❌ Next |
| Warehouses | ❌ Todo |
| Suppliers | ❌ Todo |
| Stock Transactions | ❌ Todo |
| Purchase Orders | ❌ Todo |
| Sale Orders | ❌ Todo |
| Low Stock Alerts | ❌ Todo |
| Reports | ❌ Todo |

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

## ⚠️ Critical Pattern — Zod v4 + zodResolver

Always use this in every form component:

```tsx
// ✅ CORRECT
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
})

const onSubmit = handleSubmit((values) => {
  myMutation.mutate(values)
})
```

```tsx
// ❌ WRONG — causes TypeScript errors
const { ... } = useForm<MyFormValues>({ resolver: zodResolver(mySchema) })
const onSubmit = (values: MyFormValues) => { ... }
<form onSubmit={handleSubmit(onSubmit)}>
```

---

## ⚙️ Local Dev Commands (PowerShell)

```powershell
# Backend — run every time you open a new terminal
cd backend
pipenv shell
# wait for virtualenv to activate, then:
$env:DJANGO_SETTINGS_MODULE="config.settings.local"
python manage.py runserver

# Frontend — separate terminal
cd frontend
npm run dev

# Backend: http://127.0.0.1:8000
# Frontend: http://localhost:5173
# Swagger: http://127.0.0.1:8000/swagger/
# Admin: http://127.0.0.1:8000/admin/
```

---

## ⚠️ Known Remaining Items

1. **Categories, Warehouses, Suppliers pages** — not built yet
2. **Stock, Orders, Alerts, Reports pages** — not built yet
3. **Frontend not deployed** — deploy to Vercel when more pages done
4. **CORS_ALLOWED_ORIGINS on Render** — add real Vercel URL once deployed
5. **Subtitle text on dashboard** — slightly blue, minor CSS fix needed
6. **Pipfile says python_version 3.12** — virtualenv runs 3.11.4, harmless warning
7. **Render free PostgreSQL expires July 16, 2026**
8. **No total_amount field on orders** — computed from items, not stored
9. **Celery Beat schedule** not configured for notify_low_stock periodic task