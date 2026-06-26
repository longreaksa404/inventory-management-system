# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 7)

- ✅ Built CategoriesPage (src/pages/categories/CategoriesPage.tsx) — full CRUD, modal form, delete dialog, empty state with Tag icon
- ✅ Built WarehousesPage (src/pages/warehouses/WarehousesPage.tsx) — full CRUD, code auto-uppercase, monospace badge, scrollable modal
- ✅ Built SuppliersPage (src/pages/suppliers/SuppliersPage.tsx) — full CRUD, search with 400ms debounce, optional email, line-clamp address
- ✅ Updated App.tsx after each page (all three routes live, no more ComingSoon for these)

---

## Current Folder Structure (frontend/src) — COMPLETE STATE

```
frontend/src/
├── api/
│   ├── client.ts         ✅ Axios + JWT interceptors
│   ├── auth.ts           ✅
│   ├── products.ts       ✅
│   ├── warehouses.ts     ✅
│   ├── suppliers.ts      ✅
│   ├── orders.ts         ✅
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
├── App.tsx                 ✅ (CategoriesPage, WarehousesPage, SuppliersPage all wired)
├── App.css                 ✅
├── index.css               ✅
└── main.tsx                ✅
```

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Done | |
| Dashboard | ✅ Done | |
| Products | ✅ Done | |
| Categories | ✅ Done | |
| Warehouses | ✅ Done | |
| Suppliers | ✅ Done | |
| Stock Transactions | ❌ Next | List + stock in/out/adjust forms |
| Purchase Orders | ❌ Todo | Create, confirm, receive lifecycle |
| Sale Orders | ❌ Todo | Create, confirm, ship, invoice lifecycle |
| Low Stock Alerts | ❌ Todo | Read-only list with severity indicators |
| Reports | ❌ Todo | Charts: inventory value, category summary, transaction history |

---

## Immediate Next Actions (in order)

### 1. Stock Transactions page
```
src/pages/stock/StockPage.tsx
```

Two sections on one page:
- Top: list of all StockTransaction records (paginated table) — columns: product, warehouse, type badge (IN/OUT/ADJ with colors), quantity, performed by, timestamp
- Bottom or modal: stock in / stock out / adjust forms per product
  - Stock In: product selector, warehouse selector, quantity, notes → POST /inventory/products/{id}/stock/in/
  - Stock Out: same fields → POST /inventory/products/{id}/stock/out/
  - Adjust: product selector, warehouse selector, quantity, reason → POST /inventory/products/{id}/stock/adjust/ (admin only)

Transaction type badges:
- IN → green (bg-green-50 text-green-700)
- OUT → red (bg-red-50 text-red-600)
- ADJ → blue (bg-blue-50 text-blue-700)

API endpoints used:
- GET /inventory/transactions/ → paginated list (supports ?product=, ?warehouse=, ?transaction_type= filters)
- POST /inventory/products/{id}/stock/in/ → { quantity, warehouse, notes? }
- POST /inventory/products/{id}/stock/out/ → { quantity, warehouse, notes? }
- POST /inventory/products/{id}/stock/adjust/ → { quantity, warehouse, reason? } (admin only)

### 2. Purchase Orders page
```
src/pages/orders/PurchaseOrdersPage.tsx
```

### 3. Sale Orders page
```
src/pages/orders/SaleOrdersPage.tsx
```

### 4. Low Stock Alerts page
```
src/pages/alerts/AlertsPage.tsx
```

### 5. Reports page
```
src/pages/reports/ReportsPage.tsx
```

---

## Key Technical Decisions Locked In

| Decision | Choice |
|---|---|
| Auth state | Context + useReducer in authStore.tsx |
| Server state | React Query (TanStack) |
| Forms | React Hook Form + Zod v4 |
| zodResolver usage | `useForm({ resolver: zodResolver(schema) })` — NO generic |
| HTTP client | Axios in src/api/client.ts |
| Routing | React Router v6, lazy imports in App.tsx |
| Styling | TailwindCSS + shadcn/ui CSS variables |
| Token storage | localStorage (`access_token`, `refresh_token`) |
| Debounce pattern | `window.setTimeout` stored in `let searchTimeout = 0` |
| Empty optional fields in table | Em dash `—` wrapped in `<span className="italic text-muted-foreground/50">` |
| Skeleton rows | `Array.from({ length: N }).map(...)` with animate-pulse divs |

---

## Critical Fix — Zod v4 + zodResolver Pattern

**Always use this pattern:**

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

---

## Important API Facts

- **Base URL local:** `http://127.0.0.1:8000/api/v1`
- **Base URL prod:** `https://inventory-management-system-uet9.onrender.com/api/v1`
- **Auth:** `POST /accounts/login/` → `{ access, refresh }`
- **Token header:** `Authorization: Bearer {access_token}`
- **All list endpoints paginate:** `{ count, next, previous, results[] }`
- **Role values are lowercase:** `"admin"`, `"manager"`, `"staff"`, `"customer"`
- **Stock mutations require warehouse ID in body**
- **Adjust stock is admin only** — hide or disable the button for non-admins using `isAdmin` from `useAuth()`

---

## Local Dev Commands

```powershell
# Backend
cd backend
pipenv shell
$env:DJANGO_SETTINGS_MODULE="config.settings.local"
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

---

## Known Issues / Notes

1. Dashboard low stock panel shows product/warehouse IDs not names — improve once alerts page is built
2. Frontend not deployed yet — deploy to Vercel after more pages are built
3. CORS_ALLOWED_ORIGINS on Render needs real Vercel URL once deployed
4. Render free PostgreSQL expires July 16, 2026
5. Pipfile says python_version 3.12 but virtualenv runs 3.11.4 — harmless

---

## Opening Message for Next Chat Session

Paste this at the start of the next conversation:

> I'm building an IMS fullstack portfolio project.
> Backend: Django + DRF (deployed on Render, also runs locally).
> Frontend: React + TypeScript + Vite + TailwindCSS + shadcn/ui.
>
> Done so far: auth flow, dashboard, products, categories, warehouses, suppliers — all with full CRUD.
>
> Key decisions: React Query for server state, React Hook Form + Zod v4 for forms
> (useForm without generic, handleSubmit((values) => ...) pattern),
> Context + useReducer for auth, Axios with JWT interceptors.
> Debounce with window.setTimeout stored in let searchTimeout = 0.
> Empty optional fields shown as em dash in italic muted span.
>
> See docs/NEXT_STEPS.md for full context and exact file locations.
>
> Next task: Build StockPage (src/pages/stock/StockPage.tsx).
> Two parts: (1) paginated transaction list table with IN/OUT/ADJ color badges,
> product/warehouse/type filters; (2) a stock mutation panel — three action buttons
> (Stock In, Stock Out, Adjust) that open a modal form. Adjust is admin-only.
> API: GET /inventory/transactions/, POST /inventory/products/{id}/stock/in|out|adjust/