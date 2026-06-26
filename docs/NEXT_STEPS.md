# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 6)

- ✅ Built auth flow end-to-end (login → dashboard → logout)
- ✅ Fixed axios `InternalAxiosRequestConfig` type-only import crash
- ✅ Fixed `authStore.tsx` JSX provider syntax
- ✅ Fixed Zod v4 + zodResolver type incompatibility in forms
- ✅ Built improved DashboardPage (KPI cards with icons, side-by-side chart + alerts panel)
- ✅ Built ProductsPage with full CRUD (list, search, filter, create, edit, delete)
- ✅ Wired Products route into App.tsx with lazy loading
- ✅ Backend running locally with pipenv + SQLite (local settings)

---

## Current Folder Structure (frontend/src) — COMPLETE STATE

```
frontend/src/
├── api/
│   ├── client.ts         ✅ Axios + JWT interceptors (type imports fixed)
│   ├── auth.ts           ✅ login, profile, change-password
│   ├── products.ts       ✅ products, categories, stock mutations
│   ├── warehouses.ts     ✅ warehouse CRUD
│   ├── suppliers.ts      ✅ supplier CRUD
│   ├── orders.ts         ✅ purchase + sale order lifecycle
│   └── reports.ts        ✅ all report endpoints
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx   ✅ dark sidebar, role-based nav
│   │   ├── Navbar.tsx    ✅ top bar
│   │   └── PageLayout.tsx ✅ Outlet shell wrapper
│   └── ui/
│       └── button.tsx    ✅ shadcn button
├── hooks/
│   └── useAuth.ts        ✅ isAdmin, isManager, displayName helpers
├── lib/
│   └── utils.ts          ✅ cn() utility
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx          ✅ Zod form, redirect-after-login
│   ├── dashboard/
│   │   └── DashboardPage.tsx      ✅ KPIs, bar chart, low stock panel
│   └── products/
│       └── ProductsPage.tsx       ✅ full CRUD, search, filter, badges
├── routes/
│   └── ProtectedRoute.tsx  ✅ hydration guard, redirect to /login
├── stores/
│   └── authStore.tsx       ✅ Context + useReducer, login/logout
├── types/
│   └── index.ts            ✅ all TypeScript interfaces
├── App.tsx                 ✅ lazy routes, ComingSoon placeholders
├── App.css                 ✅ Tailwind directives
├── index.css               ✅ Tailwind + CSS variables
└── main.tsx                ✅ QueryClient + Router + AuthProvider
```

---

## Pages Status

| Page | Status | Notes |
|---|---|---|
| Login | ✅ Done | Zod validation, redirect-after-login |
| Dashboard | ✅ Done | 6 API queries, KPI cards, bar chart, low stock panel |
| Products | ✅ Done | Full CRUD, search, filter, stock badges |
| Categories | ❌ Next | Simple CRUD — name + description only |
| Warehouses | ❌ Todo | CRUD — name, code, location, email |
| Suppliers | ❌ Todo | CRUD — name, contact, phone, address |
| Stock Transactions | ❌ Todo | List + stock in/out/adjust forms |
| Purchase Orders | ❌ Todo | Create, confirm, receive lifecycle |
| Sale Orders | ❌ Todo | Create, confirm, ship, invoice lifecycle |
| Low Stock Alerts | ❌ Todo | Read-only list with severity indicators |
| Reports | ❌ Todo | Charts: inventory value, category summary, transaction history |

---

## Immediate Next Actions (in order)

### 1. Categories page (simplest CRUD — good warm-up)
```
src/pages/categories/CategoriesPage.tsx
```
Fields: name, description
No stock, no SKU, no badges — just a clean table with create/edit/delete modal.
Wire into App.tsx: replace `<ComingSoon title="Categories" />` with lazy import.

### 2. Warehouses page
```
src/pages/warehouses/WarehousesPage.tsx
```
Fields: name, code, location, contact_person, phone, email, notes

### 3. Suppliers page
```
src/pages/suppliers/SuppliersPage.tsx
```
Fields: name, contact_name, email, phone, address

### 4. Stock Transactions page
```
src/pages/stock/StockPage.tsx
```
List of all transactions + stock in / stock out / adjust forms per product.

---

## Key Technical Decisions Locked In

| Decision | Choice |
|---|---|
| Auth state | Context + useReducer in authStore.tsx |
| Server state | React Query (TanStack) |
| Forms | React Hook Form + Zod v4 |
| zodResolver usage | `useForm({ resolver: zodResolver(schema) })` — NO generic, use `handleSubmit((values) => ...)` |
| HTTP client | Axios in src/api/client.ts |
| Routing | React Router v6, lazy imports in App.tsx |
| Styling | TailwindCSS + shadcn/ui CSS variables |
| Token storage | localStorage (`access_token`, `refresh_token`) |

---

## Critical Fix — Zod v4 + zodResolver Pattern

**Always use this pattern** (Zod v4 changed resolver types):

```tsx
// ✅ CORRECT
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
})

const onSubmit = handleSubmit((values) => {
  // values is correctly typed here
  myMutation.mutate(values)
})

<form onSubmit={onSubmit}>
```

```tsx
// ❌ WRONG — causes type errors with Zod v4
const { ... } = useForm<MyFormValues>({
  resolver: zodResolver(mySchema),
})
const onSubmit = (values: MyFormValues) => { ... }
<form onSubmit={handleSubmit(onSubmit)}>
```

---

## Important API Facts

- **Base URL local:** `http://127.0.0.1:8000/api/v1`
- **Base URL prod:** `https://inventory-management-backend-g3e7.onrender.com/api/v1`
- **Auth:** `POST /accounts/login/` → `{ access, refresh }`
- **Token header:** `Authorization: Bearer {access_token}`
- **Access token lifetime:** 2 hours
- **Refresh token lifetime:** 7 days
- **All list endpoints paginate:** `{ count, next, previous, results[] }`
- **Role values are lowercase:** `"admin"`, `"manager"`, `"staff"`, `"customer"`
- **localStorage keys:** `access_token`, `refresh_token`
- **Products need warehouse for stock mutations:** Pass `warehouse` ID in body

---

## Local Dev Commands

```powershell
# Backend (open new terminal, run every time)
cd backend
pipenv shell
# wait for virtualenv to activate, then:
$env:DJANGO_SETTINGS_MODULE="config.settings.local"
python manage.py runserver

# Frontend (separate terminal)
cd frontend
npm run dev

# Backend runs at: http://127.0.0.1:8000
# Frontend runs at: http://localhost:5173
# Swagger docs at: http://127.0.0.1:8000/swagger/
# Django admin at: http://127.0.0.1:8000/admin/
```

---

## Known Issues / Notes

1. Subtitle text on dashboard is blue (looks like a link) — minor CSS fix needed
2. "admin admin" at bottom of sidebar — user created with both names as "admin", not a bug
3. Pipfile says python_version = "3.12" but virtualenv runs 3.11.4 — harmless warning
4. Frontend not deployed yet — deploy to Vercel after more pages are built
5. CORS_ALLOWED_ORIGINS on Render needs real Vercel URL once deployed
6. Render free PostgreSQL expires July 16, 2026 — local SQLite used for dev

---

## Live URLs

| Resource | URL |
|---|---|
| Live API | https://inventory-management-backend-g3e7.onrender.com |
| Swagger | https://inventory-management-backend-g3e7.onrender.com/swagger/ |
| Admin | https://inventory-management-backend-g3e7.onrender.com/admin/ |
| GitHub | https://github.com/longreaksa404/inventory-management-system |
| Frontend | Not yet deployed |

---

## Opening Message for Next Chat Session

Paste this at the start of the next conversation:

> I'm building an IMS fullstack portfolio project.
> Backend: Django + DRF (deployed on Render, also runs locally).
> Frontend: React + TypeScript + Vite + TailwindCSS + shadcn/ui.
>
> Done so far: auth flow, dashboard with KPIs and charts, products page with full CRUD.
>
> Key decisions: React Query for server state, React Hook Form + Zod v4 for forms
> (useForm without generic, handleSubmit((values) => ...) pattern),
> Context + useReducer for auth, Axios with JWT interceptors.
>
> See docs/NEXT_STEPS.md for full context and exact file locations.
>
> Next task: Build CategoriesPage (src/pages/categories/CategoriesPage.tsx).
> Simple CRUD — fields are name and description only.
> Same pattern as ProductsPage but simpler — no stock, no SKU, no badges.
> After that: WarehousesPage, then SuppliersPage.