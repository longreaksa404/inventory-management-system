# 🗺️ Project Plan — IMS Fullstack

## Goal
Transform the existing Django/DRF backend into a complete fullstack portfolio project that demonstrates senior-level fullstack engineering to interviewers.

---

## 🎯 Target Role: Fullstack Developer

### What interviewers will look for:
- Clean, readable code with clear architecture decisions
- Authentication flow (JWT + protected routes)
- Real business logic (not just CRUD)
- State management
- API integration patterns
- Error handling and loading states
- Responsive UI
- Testing

---

## 🛠️ Tech Stack Decision

### Frontend
| Choice | Why |
|---|---|
| **React 18** | Industry standard, shows in most job descriptions |
| **Vite** | Faster than CRA, modern tooling |
| **TypeScript** | Shows maturity, catches bugs at compile time |
| **TailwindCSS** | Fast UI, no CSS files to manage |
| **shadcn/ui** | Professional component library built on Tailwind |
| **React Query (TanStack)** | Best-in-class server state management |
| **React Router v6** | Standard routing |
| **Axios** | HTTP client with interceptors for JWT |
| **Recharts** | Dashboard charts |
| **React Hook Form + Zod** | Forms with validation |

### Backend (already built — minor additions needed)
| Item | Status |
|---|---|
| Django + DRF | ✅ Done |
| JWT Auth | ✅ Done |
| RBAC | ✅ Done |
| All API endpoints | ✅ Done |
| CORS headers | ❌ Need to add django-cors-headers |
| API response consistency | ⚠️ Some endpoints need standardizing |

---

## 📋 Project Scope

### Phase 1 — Backend Preparation (1-2 days)
**Goal:** Make backend frontend-ready

- [ ] Add `django-cors-headers` so React can call the API
- [ ] Standardize API error responses (consistent `{detail, code, errors}` format)
- [ ] Add `dj-rest-auth` or custom token refresh interceptor support
- [ ] Add `warehouse` as required field on stock endpoints
- [ ] Add Celery Beat schedule for `notify_low_stock`
- [ ] Write missing tests to reach 80%+ coverage
- [ ] Update `.env.example` with all required variables

### Phase 2 — Frontend Foundation (2-3 days)
**Goal:** Project setup + auth working end-to-end

- [ ] Scaffold React + Vite + TypeScript project
- [ ] Configure TailwindCSS + shadcn/ui
- [ ] Set up React Router with layout structure
- [ ] Build axios instance with JWT interceptors (auto-refresh)
- [ ] Auth pages: Login, Register
- [ ] Protected route wrapper
- [ ] Role-based route guards (admin-only pages)
- [ ] Persistent auth state (localStorage + React Query)

### Phase 3 — Core Pages (4-5 days)
**Goal:** All main business pages working

- [ ] **Dashboard** — charts, KPIs, recent activity
- [ ] **Products** — list, create, edit, delete, search/filter
- [ ] **Categories** — CRUD
- [ ] **Warehouses** — CRUD
- [ ] **Suppliers** — CRUD
- [ ] **Stock Transactions** — list, stock in/out/adjust forms
- [ ] **Purchase Orders** — list, create, confirm, receive lifecycle
- [ ] **Sale Orders** — list, create, confirm, ship, invoice lifecycle
- [ ] **Low Stock Alerts** — list, highlight critical items

### Phase 4 — Reports & Polish (2-3 days)
**Goal:** Reports dashboard + production-ready UI

- [ ] **Inventory Value Report** — total value by category
- [ ] **Low Stock Report** — products below reorder level
- [ ] **Transaction History** — filterable audit log
- [ ] **Category Summary** — pie/bar chart
- [ ] Loading skeletons on all data tables
- [ ] Error boundaries
- [ ] Empty states
- [ ] Toast notifications (success/error feedback)
- [ ] Responsive mobile layout

### Phase 5 — Deploy & Portfolio Polish (1 day)
**Goal:** Live URL + clean README

- [ ] Deploy frontend to Vercel or Netlify
- [ ] Connect frontend to production backend on Render
- [ ] Update README with screenshots + live demo link
- [ ] Record a 2-minute demo video (optional but impressive)
- [ ] Clean up GitHub commits

---

## 📁 Proposed Folder Structure (Frontend)

```
frontend/
├── src/
│   ├── api/              # Axios instance + all API calls
│   │   ├── client.ts     # Axios setup with interceptors
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   └── reports.ts
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/        # Sidebar, Navbar, PageHeader
│   │   ├── tables/        # Reusable DataTable component
│   │   └── forms/         # Reusable form components
│   ├── pages/
│   │   ├── auth/          # Login, Register
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── reports/
│   │   └── settings/
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Auth state (Zustand or Context)
│   ├── types/             # TypeScript interfaces matching API
│   ├── utils/             # Helpers, formatters
│   └── routes/            # Router config + guards
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎨 UI Design Direction

**Style:** Clean, professional, dark sidebar + white content area  
**Reference:** Similar to Linear, Vercel dashboard, or Shadcn blocks  
**Color scheme:** Neutral grays + one accent color (blue or indigo)  

### Key UI Components to build:
- Sidebar navigation with role-based menu items
- Data tables with sorting, filtering, pagination
- Status badges (draft/confirmed/shipped etc.)
- Stock level indicators (green/yellow/red)
- Modal forms for create/edit
- Confirmation dialogs for destructive actions
- Toast notifications

---

## 📊 Dashboard KPIs to show

- Total inventory value
- Total products
- Low stock alerts count
- Pending purchase orders
- Pending sale orders
- Recent transactions (last 10)
- Stock value by category (bar chart)
- Order status breakdown (pie chart)

---

## 🔒 Frontend Auth Flow

```
User visits app
  → Check localStorage for token
    → Valid token → load app
    → No token / expired → redirect to /login

Login page
  → POST /api/v1/accounts/login/
  → Store access + refresh token
  → Decode role from JWT payload
  → Redirect to dashboard

Axios interceptor
  → On every request: attach Authorization: Bearer {token}
  → On 401 response: try refresh token
    → Success: retry original request
    → Fail: clear tokens, redirect to login

Protected routes
  → Wrap all pages in <ProtectedRoute>
  → Role guard: <AdminRoute> wraps admin-only pages
```

---

## 📅 Suggested Timeline

| Week | Focus |
|---|---|
| Week 1 | Phase 1 (backend prep) + Phase 2 (frontend foundation + auth) |
| Week 2 | Phase 3 (core pages — products, warehouses, suppliers, stock) |
| Week 3 | Phase 3 continued (orders lifecycle) + Phase 4 (reports) |
| Week 4 | Phase 4 polish + Phase 5 (deploy + README) |

---

## 💼 Interview Talking Points This Project Covers

| Topic | Where in project |
|---|---|
| RESTful API design | All DRF endpoints |
| JWT authentication | Login + token refresh interceptor |
| Role-based access control | RBAC on every endpoint + frontend guards |
| Database transactions | `select_for_update()` in ship/receive |
| Async background tasks | Celery + Redis for shipping/notifications |
| Race condition handling | `select_for_update()` preventing double deduction |
| Signal-driven architecture | `post_save` signals for reports + alerts |
| React state management | React Query for server state |
| TypeScript | Full type safety on frontend |
| Testing | pytest suite for backend, component tests for frontend |
| CI/CD | GitHub → Render auto-deploy |
| Performance | Aggregated ORM queries, pagination |
