# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 18)

- ✅ **Full test suite: 83/83 passed.** Confirmed the `phone_number` patch (exempting `role == 'customer'`) was already applied in `apps/accounts/models.py`. Customer tests 14/14, user management tests 7/7, full suite clean.
- ✅ **Tier 4 Item 1 — User Management page (backend + frontend + tests).** Built `UserManagementView` (admin-only `GET/PATCH /api/v1/accounts/<id>/`), `UserManagementSerializer` (role + is_active writable, everything else read-only, is_staff auto-synced from role), `AdminRoute` guard, `UsersPage.tsx` (inline role dropdown, activate/deactivate toggle, self-protection shield, filter by role), `userManagement.ts` API layer, `test_api_user_management.py` (7 tests). URL wired at `apps/accounts/urls.py`.
- ✅ **Tier 4 Item 2 — Product detail page (frontend).** Built `ProductDetailPage.tsx` at `/products/:id` — product info card with stock health bar, full stock transaction history table with pagination. `ProductsPage.tsx` product name cell becomes a `<Link>` to the detail page.
- 🐛 **Found `is_active` gap while building UsersPage** — `UserListSerializer` and the `User` TypeScript type both omitted `is_active`, so the active/inactive badge and toggle button on UsersPage would have been broken. Fix: add `'is_active'` to `UserListSerializer.Meta.fields` in `apps/accounts/serializers.py`, and add `is_active: boolean` to the `User` interface in `frontend/src/types/index.ts`. Documented in `users_view.diff` — **not yet confirmed applied; verify before deploying**.
- ✅ **App.tsx updated** — now includes lazy imports and routes for both `UsersPage` (`/users`, inside `<AdminRoute>`) and `ProductDetailPage` (`/products/:id`).

---

## Current Architecture (Production)

| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel | https://inventory-management-system-liard-delta.vercel.app |
| Backend | Render | https://inventory-management-system-uet9.onrender.com |
| Database | Supabase PostgreSQL | Singapore region, session pooler |
| Cache/Queue | Upstash Redis | via REDIS_URL env var on Render |

---

## Immediate Next Actions (in priority order)

### 1. Apply the is_active fix (small, blocking UsersPage correctness)
In `apps/accounts/serializers.py` — `UserListSerializer.Meta.fields`:
```python
fields = [
    'id', 'email', 'username', 'first_name', 'last_name',
    'phone_number', 'role', 'is_staff', 'is_active', 'date_joined',
]
read_only_fields = fields
```
In `frontend/src/types/index.ts` — `User` interface:
```ts
is_active: boolean   // add after is_staff
```
No migration needed. Re-run `pytest -v` after the backend change to confirm still 83/83.

### 2. Manual browser verification (carried over from Session 15, still outstanding)
- Open Sale Order form → `+` next to customer dropdown → create customer **without** phone number → confirm 201, modal closes, customer auto-selected, order submits end-to-end.
- Repeat **with** phone number to confirm no regression.
- Also verify UsersPage: log in as admin → `/users` → change a role → confirm badge updates → toggle deactivate → confirm status changes.

### 3. Tier 4 Item 3 — Dark/light mode toggle (last Tier 4 item, unblocked)
- CSS vars for both themes already defined in `frontend/src/index.css` (`:root` and `.dark`).
- Add a toggle button in the Sidebar footer (below the user avatar block).
- Toggle adds/removes `.dark` class on `<html>` element.
- Persist preference in `localStorage` key `theme`.
- Load persisted preference on app boot (in `main.tsx` or a `useTheme` hook).
- No backend changes needed.

### 4. ReportsPage LowStockSection — product name labels (one-liner, low priority)
Labels currently show `Product #N` instead of product name because `LowStockReportView` returns `product_name` but `LowStockSection` in `ReportsPage.tsx` uses `item.product` (the ID). Change `item.product` to `item.product_name` in the bar label. One line.

### 5. README portfolio polish (no decisions needed, do anytime)
- Add screenshots of Dashboard, Products, Orders pages
- Add live demo URLs (frontend Vercel + backend Render + Swagger)
- Add tech stack badges
- Clean up local dev section

---

## Blocked on Your Decisions

| Item | Decision needed |
|---|---|
| Product picture | Cloudinary (real hosting, needs API key) vs base64-in-DB (zero setup, slower) |
| Celery Beat in production | Second Render worker (cost/complexity) vs leave code-only, not running |
| Uptime Robot | No code — manual setup at uptimerobot.com when ready |

---

## Known Issues (carried over)

| Issue | Location | Status |
|---|---|---|
| Warehouse column blank on Alerts/Dashboard low-stock | `AlertsPage.tsx`, `DashboardPage.tsx` | Deliberately deferred — do NOT fix unless asked |
| ReportsPage bar labels show `Product #N` | `ReportsPage.tsx` `LowStockSection` | Open — one-line fix, low priority |
| Polling hook has no unmount cleanup | `useOrderStatusPolling.ts` | Low-risk, optional follow-up |
| **`is_active` missing from `UserListSerializer` and `User` type** | `serializers.py`, `types/index.ts` | **Fix required before UsersPage works correctly — see Step 1 above** |
| Quick-create modal flow not manually verified in browser | `SaleOrdersPage.tsx` | Carried over from Session 15 — see Step 2 above |

---

## Opening Message for Next Chat Session

Paste this at the start of the next conversation:

> I'm building an IMS fullstack portfolio project.
> Backend: Django + DRF (deployed on Render, database on Supabase PostgreSQL).
> Frontend: React + TypeScript + Vite + TailwindCSS (deployed on Vercel).
>
> Live URLs:
> - Frontend: https://inventory-management-system-liard-delta.vercel.app
> - Backend: https://inventory-management-system-uet9.onrender.com
>
> See docs/NEXT_STEPS.md, docs/PROJECT_HANDOFF.md, and docs/PROJECT_PLAN.md (Phase 6) for full context.
>
> Session 18 just completed: 83/83 tests passing. Built Tier 4 Items 1 and 2 — User Management page (backend + frontend + 7 tests, admin-only, inline role dropdown, activate/deactivate, self-protection guard) and Product Detail page (/products/:id, info card + transaction history). Found is_active gap in UserListSerializer and User type — fix documented, not yet applied. Manual browser verification of Sale Order quick-create-customer flow still outstanding.
>
> Next task: apply the is_active fix (see Step 1 in NEXT_STEPS.md), do the manual browser verification (Step 2), then build the dark/light mode toggle (Tier 4 Item 3, last unblocked item). After that, README polish and the two blocked Tier 5 items (product picture, Celery Beat) pending your decisions on storage backend and worker deployment.
>
> Deliberately deferred (do NOT fix unless I ask): blank warehouse column on Alerts/Dashboard low-stock views.