# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 15)

- ✅ **New scope identified and built — Customer management.** While verifying Tier 2 (Sale Order customer dropdown), discovered there was **no way to create a customer at all** through the app — `RegistrationSerializer` always force-sets `role='staff'`, and `role` is read-only on that serializer by design (prevents self-registering admins). The only `role="customer"` users that ever existed were manually seeded via Django admin/shell/fixtures. Closed this gap with a full build:
  - **Backend:**
    - New `apps/accounts/permissions.py` → `CustomerPermission`: any authenticated user can list/create customers (staff need this to quick-add a customer mid-order); editing/deactivating an existing customer is restricted to `role in ("admin", "manager")`.
    - New `CustomerSerializer` in `apps/accounts/serializers.py` — separate from `RegistrationSerializer` on purpose (no password collected; customers don't log in through this system; `role` force-set server-side to `'customer'`; `username` falls back to `email` if not supplied).
    - New `CustomerListCreateView` / `CustomerDetailView` in `apps/accounts/views.py`, mounted at `POST/GET /api/v1/accounts/customers/` and `GET/PATCH /api/v1/accounts/customers/{id}/`.
    - **Deliberately no DELETE** — `SaleOrder.customer` is `on_delete=PROTECT`, so a real delete would 500 once a customer has orders. `is_active` toggle via `PATCH` is the supported way to retire a customer record (same pattern you'd want for any audit-trail-sensitive entity in this system).
  - **Frontend:**
    - New `src/api/customers.ts` — `getCustomers`, `getCustomer`, `createCustomer`, `updateCustomer`.
    - New `Customer` / `CustomerPayload` types in `src/types/index.ts`.
    - New `src/pages/customers/CustomersPage.tsx` — full CRUD-style page matching the existing Suppliers/Warehouses pattern (search, table, create/edit modal, active/inactive badge + toggle button instead of delete).
    - Exported `CustomerForm` from that page so it can be reused for the inline quick-create.
    - **Inline quick-create (Option B):** `SaleOrdersPage.tsx` → `CreateSOForm` now has a small "+" button next to the customer dropdown that opens `CustomerForm` in a modal. On success it invalidates the `["users", {role:"customer"}]` query (so the dropdown picks up the new customer) and auto-selects the new customer in the form via `setValue("customer", customer.id)`.
    - New route `/customers` in `App.tsx` (lazy-loaded), new sidebar nav item under "Operations" (visible to all roles — server-side permission already gates editing to admin/manager).
- ✅ **Tier 2 — customer dropdown label finalized as part of this work.** Earlier in the session, settled on **name + phone** (`{first_name} {last_name} ({phone_number})`) instead of the original `CT00XX` internal ID — matches the `+855xxxxxxxx` field already validated on `CustomUser`, falls back to plain name if phone is blank. Price auto-fill was independently verified correct, no changes needed there.
- ⚠️ **Known limitation, not addressed this session:** `CustomerListCreateView` is paginated at the global `PAGE_SIZE=50` like every other list endpoint. Past 50 customers, both the `/customers` management page and the Sale Order dropdown will only show the first page unless pagination/search is added to the dropdown UX. Flagged for later, not urgent at current scale.

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

### Tier 1 — ✅ DONE (Session 13)
Low stock alert bug fully diagnosed and fixed.

### Tier 2 — ✅ DONE (Session 14–15)
Sale Order form UX: price auto-fill verified correct; customer dropdown changed to name + phone.

### Tier 3 — ✅ DONE (Session 14)
Async polling after Ship/Receive (`useOrderStatusPolling` hook, used in both order pages).

### New — ✅ DONE (Session 15)
Customer management (full CRUD page + inline quick-create from Sale Order form). See summary above.

**Required follow-up, not done yet — write tests.** This was a fast feature build with zero test coverage added. Before calling it done-done:
- Backend: `tests/api/test_api_customers.py` — covers create (any authenticated user incl. plain staff), list with search, PATCH restricted to admin/manager (403 for staff), `is_active` toggle behavior, and that `username` correctly falls back to `email`.
- Confirm in the browser: quick-create modal actually closes, selects the new customer, and the Sale Order submits correctly end-to-end.

### Tier 4 — New pages (next up after the test coverage above)
**1. User management page**
- Backend: add `PATCH /api/v1/accounts/{id}/` accepting `{role}` and/or `{is_active}`, admin-only permission
- Frontend: new page at `/users`, admin-only route guard, hidden from sidebar for non-admins
- Table: name, email, role badge, active/inactive toggle, date joined
- Search/filter by name or email
- Not started yet
- Note: this is a *different* endpoint/page from the new Customer management above — `/accounts/{id}/` (any role) vs `/accounts/customers/{id}/` (customers only). Don't conflate them.

**2. Product detail page**
- New route `/products/:id`
- Shows full product info + stock transaction history (reuse `productsApi.getStockHistory`)
- Linked from `ProductsPage.tsx` table rows
- Not started yet

**3. Dark/light mode toggle**
- CSS vars for both themes already exist in `index.css` (`.dark` class is defined)
- Add a toggle button (sidebar footer is a natural spot) + persist preference via localStorage (real app, not an artifact — localStorage is fine here)
- Toggle adds/removes `.dark` class on `<html>` or root element
- Not started yet

### Tier 5 — BLOCKED on your decisions
**Product picture** — ⏳ waiting on: Cloudinary (real hosting, needs your API key) vs base64-in-DB (zero setup, slower)
**Celery Beat in production** — ⏳ waiting on: deploy a second Render worker (cost/complexity) vs leave Beat code-only, not running in production
**Uptime Robot** — no code needed, you can do this anytime: create a free monitor at uptimerobot.com pointed at `https://inventory-management-system-uet9.onrender.com/api/`, 5 min interval

### Tier 6 — Deferred to roadmap (documented in PROJECT_SCOPE.md, not built)
- Per-warehouse stock tracking
- Pricing events / discount engine (seasonal %, bulk discount rules)

---

## Known Issues (carried over)

| Issue | Location | Notes |
|---|---|---|
| Low stock alert not working | — | ✅ FIXED Session 13 |
| Warehouse column blank on Alerts/Dashboard low-stock views | `AlertsPage.tsx`, `DashboardPage.tsx` | Known side-effect of Session 13 fix, explicitly deferred per user decision |
| ReportsPage bar labels show `Product #N` | `ReportsPage.tsx` `LowStockSection` | Still open — API now returns `product_name`, one-line fix |
| Polling hook has no unmount cleanup | `frontend/src/hooks/useOrderStatusPolling.ts` | Low-risk, optional follow-up |
| Customer endpoints paginated at 50 | `apps/accounts/views.py` `CustomerListCreateView` | Fine now, flagged for later if customer count grows past one page |
| **No test coverage on new Customer endpoints/pages** | `apps/accounts/views.py`, `CustomersPage.tsx` | **New this session — write `test_api_customers.py` before moving to Tier 4** |

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
> Session 15 just completed: built full Customer management (backend `CustomerListCreateView`/`CustomerDetailView` + `CustomerPermission`, frontend `CustomersPage.tsx` + inline quick-create from the Sale Order form). This wasn't in the original backlog — it surfaced because there was no way to create a customer at all before this. Tier 2 (Sale Order dropdown UX) and Tier 3 (async polling) are also done from prior sessions.
>
> Next task: write backend test coverage for the new customer endpoints (`tests/api/test_api_customers.py` — creation by plain staff, search, admin/manager-only PATCH, is_active toggle, username-falls-back-to-email), then manually verify the quick-create modal flow in the browser. After that, move to Tier 4 in order: user management page (admin-only, different from customer management — don't conflate the two), product detail page, dark mode toggle.
>
> Tier 5 items (product picture, Celery Beat in production) are still blocked on my decisions — don't start those until I confirm Cloudinary vs base64, and whether to deploy a second Render worker for Celery Beat.
>
> Also note: the blank "Warehouse" column on the Low Stock Alerts page is a known, deliberately-deferred side effect of the Tier 1 fix — do not "fix" it unless I explicitly ask.