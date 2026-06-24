# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 5)

- ✅ Restructured repo into monorepo: `backend/` and `frontend/`
- ✅ Updated `render.yaml` with `rootDir: backend`
- ✅ Scaffolded React + Vite + TypeScript frontend
- ✅ Installed all dependencies (Axios, React Query, React Router, Zod, Recharts, lucide-react, clsx, tailwind-merge)
- ✅ Set up Tailwind CSS v3 + shadcn/ui (Nova preset, Radix, 4.10.0)
- ✅ Fixed shadcn path issues — components correctly placed in `src/components/ui/`
- ✅ Created `src/types/index.ts` — all TypeScript interfaces matching backend API shapes
- ✅ Created `src/api/client.ts` — Axios instance with JWT interceptors + auto-refresh on 401
- ✅ Created `src/api/auth.ts` — login, profile, change password, refresh token
- ✅ Created `src/api/products.ts` — products, categories, stock in/out/adjust, transactions
- ✅ Created `src/api/warehouses.ts` — warehouse CRUD
- ✅ Created `src/api/suppliers.ts` — supplier CRUD
- ✅ Created `src/api/orders.ts` — purchase orders + sale orders full lifecycle
- ✅ Created `src/api/reports.ts` — inventory value, low stock, category summary, transaction history

---

## Immediate Next Actions (in order)

### 1. Create remaining folders and files
```cmd
cd frontend
New-Item -Path "src\stores\authStore.ts" -ItemType File -Force
New-Item -Path "src\hooks\useAuth.ts" -ItemType File -Force
New-Item -Path "src\components\layout\Sidebar.tsx" -ItemType File -Force
New-Item -Path "src\components\layout\Navbar.tsx" -ItemType File -Force
New-Item -Path "src\components\layout\PageLayout.tsx" -ItemType File -Force
New-Item -Path "src\routes\ProtectedRoute.tsx" -ItemType File -Force
New-Item -Path "src\pages\auth\LoginPage.tsx" -ItemType File -Force
New-Item -Path "src\pages\dashboard\DashboardPage.tsx" -ItemType File -Force
```

### 2. Build in this exact order (each depends on the previous)

| Step | File | Purpose |
|---|---|---|
| 1 | `src/stores/authStore.ts` | JWT token storage + user state using React Context |
| 2 | `src/hooks/useAuth.ts` | Hook to consume auth store cleanly in components |
| 3 | `src/main.tsx` | Wrap app with React Query + Router providers |
| 4 | `src/App.tsx` | Route definitions with protected route wiring |
| 5 | `src/routes/ProtectedRoute.tsx` | Redirect to /login if no token |
| 6 | `src/pages/auth/LoginPage.tsx` | Login form with React Hook Form + Zod |
| 7 | `src/components/layout/Sidebar.tsx` | Navigation sidebar with role-based menu |
| 8 | `src/components/layout/Navbar.tsx` | Top bar with user info + logout |
| 9 | `src/components/layout/PageLayout.tsx` | Shell wrapper for all authenticated pages |
| 10 | `src/pages/dashboard/DashboardPage.tsx` | KPIs + charts using real API data |

---

## Current Folder Structure (frontend/src)

```
frontend/src/
├── api/
│   ├── client.ts       ✅ Axios instance + JWT interceptors
│   ├── auth.ts         ✅ login, profile, change-password
│   ├── products.ts     ✅ products, categories, stock mutations
│   ├── warehouses.ts   ✅ warehouse CRUD
│   ├── suppliers.ts    ✅ supplier CRUD
│   ├── orders.ts       ✅ purchase + sale order lifecycle
│   └── reports.ts      ✅ all report endpoints
├── assets/             (Vite default)
├── components/
│   ├── ui/             ✅ shadcn components (button.tsx)
│   └── layout/         ← Sidebar, Navbar, PageLayout (next)
├── hooks/              ← useAuth.ts (next)
├── lib/
│   └── utils.ts        ✅ shadcn cn() utility
├── pages/
│   ├── auth/           ← LoginPage.tsx (next)
│   └── dashboard/      ← DashboardPage.tsx (next)
├── routes/             ← ProtectedRoute.tsx (next)
├── stores/             ← authStore.ts (next)
├── types/
│   └── index.ts        ✅ all TypeScript interfaces
├── App.css             ✅ Tailwind directives only
├── App.tsx             ← needs rewrite with router
├── index.css           ✅ Tailwind + shadcn CSS variables
└── main.tsx            ← needs React Query + Router providers
```

---

## Key Technical Decisions Already Made

| Decision | Choice | Reason |
|---|---|---|
| Auth state | React Context + useReducer | No extra dependency, sufficient for this scale |
| Token storage | localStorage | Survives page refresh, acceptable for portfolio |
| HTTP client | Axios | Interceptors handle JWT refresh transparently |
| Server state | React Query (TanStack) | Caching, loading/error states, refetch on focus |
| Forms | React Hook Form + Zod | Type-safe validation, minimal re-renders |
| Routing | React Router v6 | Industry standard |
| UI components | shadcn/ui (Nova preset) | Professional look, fully customizable |
| Charts | Recharts | Works well with React, good TypeScript support |

---

## Important API Facts

- **Base URL local:** `http://127.0.0.1:8000/api/v1`
- **Base URL prod:** `https://inventory-management-backend-g3e7.onrender.com/api/v1`
- **Auth:** `POST /accounts/login/` → `{ access, refresh }`
- **Token header:** `Authorization: Bearer {access_token}`
- **Access token lifetime:** 2 hours
- **Refresh token lifetime:** 7 days
- **Token refresh endpoint:** `POST /accounts/refresh/` → `{ access }`
- **All list endpoints paginate:** `{ count, next, previous, results[] }`
- **Role values are lowercase:** `"admin"`, `"manager"`, `"staff"`, `"customer"`
- **localStorage keys:** `access_token`, `refresh_token`

---

## Auth Flow to Implement

```
User visits app
  → Check localStorage for access_token
    → Token exists → load user profile → show app
    → No token → redirect to /login

LoginPage
  → POST /api/v1/accounts/login/ with { email, password }
  → Store access_token + refresh_token in localStorage
  → Fetch user profile → store in React Context
  → Redirect to /dashboard

Axios interceptor (already written in client.ts)
  → Every request: attach Authorization: Bearer {token}
  → On 401: try POST /accounts/refresh/
    → Success: retry original request
    → Fail: clear tokens → redirect to /login

ProtectedRoute
  → If no token in localStorage → <Navigate to="/login" />
  → If token exists → render children
```

---

## Dashboard KPIs to Show

Fetch from these endpoints on mount:
- `GET /reports/inventory-value/` → total inventory value
- `GET /reports/low-stock/` → count of low stock items
- `GET /reports/category-summary/` → bar chart data
- `GET /inventory/products/?page=1` → total product count (use `count` field)
- `GET /orders/purchase-orders/?status=draft` → pending purchase orders
- `GET /orders/sales/?status=draft` → pending sale orders

---

## Shadcn Components to Install Before Building UI

Run these from the `frontend/` directory:
```cmd
npx shadcn@4.10.0 add card
npx shadcn@4.10.0 add input
npx shadcn@4.10.0 add label
npx shadcn@4.10.0 add form
npx shadcn@4.10.0 add dropdown-menu
npx shadcn@4.10.0 add badge
npx shadcn@4.10.0 add table
npx shadcn@4.10.0 add dialog
npx shadcn@4.10.0 add select
npx shadcn@4.10.0 add toast
npx shadcn@4.10.0 add separator
npx shadcn@4.10.0 add avatar
npx shadcn@4.10.0 add skeleton
```

---

## Local Dev Commands

```cmd
# Backend
cd backend
pipenv shell
set DJANGO_SETTINGS_MODULE=config.settings.local
python manage.py runserver

# Frontend (separate terminal)
cd frontend
npm run dev

# Run backend tests
cd backend
set DJANGO_SETTINGS_MODULE=config.settings.test
pytest
```

---

## Live URLs

| Resource | URL |
|---|---|
| Live API | https://inventory-management-backend-g3e7.onrender.com |
| Swagger | https://inventory-management-backend-g3e7.onrender.com/swagger/ |
| Admin | https://inventory-management-backend-g3e7.onrender.com/admin/ |
| GitHub | https://github.com/longreaksa404/inventory-management-system |
| Frontend (TBD) | Deploy to Vercel after login page is working |

---

## Opening Message for Next Chat Session

Paste this at the start of the next conversation:

> **Current task:** Continue building the IMS frontend. Backend is fully deployed. Frontend scaffolding is complete — Vite + React + TypeScript + Tailwind + shadcn/ui is working, all API files and TypeScript types are written. Next step is `src/stores/authStore.ts`, then `useAuth` hook, then update `main.tsx` and `App.tsx` with providers and routing, then `ProtectedRoute`, then `LoginPage`. See `backend/docs/NEXT_STEPS.md` for full context and exact file order.