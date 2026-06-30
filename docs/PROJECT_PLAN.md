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
| CORS headers | ✅ Done |
| API response consistency | ⚠️ Some endpoints need standardizing |

---

## 📋 Project Scope

### Phase 1 — Backend Preparation ✅ Done
- Add `django-cors-headers` so React can call the API
- Standardize API error responses
- Add `warehouse` as required field on stock endpoints
- Add Celery Beat schedule for `notify_low_stock`
- Write missing tests to reach 80%+ coverage
- Update `.env.example` with all required variables

### Phase 2 — Frontend Foundation ✅ Done
- Scaffold React + Vite + TypeScript project
- Configure TailwindCSS + shadcn/ui
- Set up React Router with layout structure
- Build axios instance with JWT interceptors (auto-refresh)
- Auth pages: Login, Register
- Protected route wrapper
- Role-based route guards
- Persistent auth state

### Phase 3 — Core Pages ✅ Done
- Dashboard, Products, Categories, Warehouses, Suppliers
- Stock Transactions, Purchase Orders, Sale Orders, Low Stock Alerts

### Phase 4 — Reports & Polish ✅ Done
- Inventory Value Report, Low Stock Report, Transaction History, Category Summary
- Loading skeletons, error boundaries, empty states
- Responsive mobile layout

### Phase 5 — Deploy & Portfolio Polish 🔄 In progress
- ✅ Deployed frontend to Vercel
- ✅ Connected frontend to production backend on Render
- ✅ Fixed Product #N / Warehouse #N display bug (Session 11)
- [ ] Update README with screenshots + live demo link
- [ ] Record a 2-minute demo video (optional)
- [ ] Clean up GitHub commits

### Phase 6 — Backlog: Fixes, UX, and New Pages 🆕 Not started
Ordered by priority — see `docs/NEXT_STEPS.md` for the live, session-by-session breakdown.

**Tier 1 — Bug fixes**
- [ ] Low stock alert not triggering correctly — root cause investigation required

**Tier 2 — Sale Order form UX (batched, same file)**
- [ ] Customer dropdown with `CT00XX` display label, replacing raw numeric Customer ID input
  - Backend: `?role=` query filter on `AccountsView` + permission split (customer list = any authenticated user, full list = admin only)
- [ ] Price auto-fill on line item product selection (stays editable)

**Tier 3 — Order lifecycle UX**
- [ ] Async polling after Ship/Receive actions (202 Accepted → poll every 2s for ~15s → status updates without manual refresh)

**Tier 4 — New pages**
- [ ] User management page (admin-only): list, change role, toggle active/inactive
  - Backend: `PATCH /accounts/{id}/` endpoint
- [ ] Product detail page: full info + stock transaction history
- [ ] Dark/light mode toggle with persistence (CSS vars already support `.dark`)

**Tier 5 — Blocked on decisions (see Open Decisions in PROJECT_SCOPE.md)**
- [ ] Product picture (blocked: Cloudinary vs base64 storage decision)
- [ ] Celery Beat in production (blocked: deploy second Render worker vs code-only)
- [ ] Uptime Robot monitor (no code — manual setup whenever)

**Tier 6 — Deferred to roadmap, not built this cycle**
- Per-warehouse stock tracking (schema change — `ProductWarehouseStock` through-table)
- Pricing events / discount engine (seasonal %, bulk discounts — real feature, multi-session)

---

## 📁 Frontend Folder Structure (current)

```
frontend/
├── src/
│   ├── api/              # Axios instance + all API calls ✅
│   ├── components/
│   │   ├── ui/            ✅
│   │   └── layout/        ✅ Sidebar, Navbar, PageLayout
│   ├── pages/
│   │   ├── auth/          ✅
│   │   ├── dashboard/     ✅
│   │   ├── products/      ✅
│   │   ├── categories/    ✅
│   │   ├── warehouses/    ✅
│   │   ├── suppliers/     ✅
│   │   ├── stock/         ✅
│   │   ├── orders/        ✅
│   │   ├── alerts/        ✅
│   │   ├── reports/       ✅
│   │   ├── users/         🆕 planned (Phase 6, Tier 4)
│   │   └── products/[id]/ 🆕 planned — product detail page (Phase 6, Tier 4)
│   ├── hooks/             ✅
│   ├── stores/            ✅
│   ├── types/             ✅
│   ├── utils/
│   └── routes/            ✅
├── public/
└── ...
```

---

## 🎨 UI Design Direction

**Style:** Clean, professional, dark sidebar + white content area
**Reference:** Similar to Linear, Vercel dashboard, or Shadcn blocks
**Color scheme:** Neutral grays + one accent color (blue or indigo)
**New (Phase 6):** Dark/light mode toggle — CSS variables in `index.css` already define both `:root` and `.dark`, just needs a toggle component + persisted preference

---

## 📊 Dashboard KPIs (current)

- Total inventory value
- Total products
- Low stock alerts count
- Pending purchase orders
- Pending sale orders
- Stock value by category (bar chart)

---

## 🔒 Frontend Auth Flow (current)

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
  → Role guard: <AdminRoute> wraps admin-only pages (Phase 6: extend to /users page)
```

---

## 💼 Interview Talking Points This Project Covers

| Topic | Where in project |
|---|---|
| RESTful API design | All DRF endpoints |
| JWT authentication | Login + token refresh interceptor |
| Role-based access control | RBAC on every endpoint + frontend guards, extended in Phase 6 with user management |
| Database transactions | `select_for_update()` in ship/receive |
| Async background tasks | Celery + Redis for shipping/notifications |
| Race condition handling | `select_for_update()` preventing double deduction |
| Signal-driven architecture | `post_save` signals for reports + alerts |
| Async UX patterns | Polling pattern after 202 Accepted responses (Phase 6) |
| Deliberate scope management | Pricing engine + per-warehouse stock scoped but consciously deferred — documented in PROJECT_SCOPE.md as a senior-level "what I'd build next" signal |
| React state management | React Query for server state |
| TypeScript | Full type safety on frontend |
| Testing | pytest suite for backend |
| CI/CD | GitHub → Render auto-deploy |
| Performance | Aggregated ORM queries, pagination |