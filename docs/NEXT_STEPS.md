# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 12)

- ✅ Reviewed and prioritized a full new backlog of fixes/features (see below)
- ✅ Added all new items to `docs/PROJECT_SCOPE.md` (in-scope, out-of-scope, and a new "Open Decisions" section)
- ✅ Added a new **Phase 6** to `docs/PROJECT_PLAN.md` with tiered backlog and updated interview talking points
- ✅ Decided: Django admin stays the tool for permission groups; new frontend "User management" page is a lighter role + active-status manager only
- ✅ Decided: Customer ID field will NOT change the database PK — it's a display-only fix (dropdown showing "Name — CT0007", submitting the real numeric ID)
- ✅ Decided: Pricing events/discount engine and per-warehouse stock tracking are deliberately deferred to roadmap, not built this cycle
- ⏳ Still waiting on 2 decisions before related items can start (see "Blocked" below)

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

### Tier 1 — Bug fix (do first, no dependencies)
**1. Fix low stock alert not triggering**
- Investigate root cause first — check `LowStockAlert.objects.get_or_create()` call sites in `apps/inventory/signals.py`, `apps/orders/models.py` (`SaleOrder.ship()`), and `apps/inventory/tasks.py` (`notify_low_stock`)
- Confirm: is the bug in alert creation, the report endpoint, or the frontend display?
- No size estimate yet — diagnose first, then fix

### Tier 2 — Sale Order form UX (batch together, same file: `SaleOrdersPage.tsx`)
**2. Customer dropdown with CT00XX label**
- Backend: add `?role=` query param filter to `AccountsView` in `apps/accounts/views.py`
- Backend: split permission — customer-filtered list available to any authenticated user, full unfiltered list stays admin-only
- Frontend: replace raw `Customer ID` number input in `CreateSOForm` with a `<select>` populated from `?role=customer` users
- Frontend: label format `"{first_name} {last_name} — CT{id padded to 4 digits}"`, e.g. `John Doe — CT0007`
- Submits the real numeric `id` under the hood — no DB change

**3. Price auto-fill on sale order line items**
- In `CreateSOForm`, when a product is selected in a line item row, auto-fill that row's `unit_price` from the product's current price
- Keep the field editable after auto-fill (staff may still override)

### Tier 3 — Order lifecycle UX
**4. Async polling after Ship/Receive**
- After `ordersApi.shipSaleOrder()` / `ordersApi.receivePurchaseOrder()` returns 202, poll the order detail every 2s for ~15s (or until status changes) instead of a single `invalidateQueries` call
- Applies to both `PurchaseOrdersPage.tsx` and `SaleOrdersPage.tsx`

### Tier 4 — New pages
**5. User management page**
- Backend: add `PATCH /api/v1/accounts/{id}/` accepting `{role}` and/or `{is_active}`, admin-only permission
- Frontend: new page at `/users`, admin-only route guard, hidden from sidebar for non-admins
- Table: name, email, role badge, active/inactive toggle, date joined
- Search/filter by name or email

**6. Product detail page**
- New route `/products/:id`
- Shows full product info + stock transaction history (reuse `productsApi.getStockHistory`)
- Linked from `ProductsPage.tsx` table rows

**7. Dark/light mode toggle**
- CSS vars for both themes already exist in `index.css` (`.dark` class is defined)
- Add a toggle button (sidebar footer is a natural spot) + persist preference (use React state/Context, NOT localStorage per artifact rules — but this is the real app, not an artifact, so localStorage IS fine here)
- Toggle adds/removes `.dark` class on `<html>` or root element

### Tier 5 — BLOCKED on your decisions
**8. Product picture** — ⏳ waiting on: Cloudinary (real hosting, needs your API key) vs base64-in-DB (zero setup, slower)
**9. Celery Beat in production** — ⏳ waiting on: deploy a second Render worker (cost/complexity) vs leave Beat code-only, not running in production
**10. Uptime Robot** — no code needed, you can do this anytime: create a free monitor at uptimerobot.com pointed at `https://inventory-management-system-uet9.onrender.com/api/`, 5 min interval

### Tier 6 — Deferred to roadmap (documented in PROJECT_SCOPE.md, not built)
- Per-warehouse stock tracking
- Pricing events / discount engine (seasonal %, bulk discount rules)
- README should mention these as "Future Work" — good interview signal for deliberate scoping

---

## Known Issues (carried over)

| Issue | Location | Notes |
|---|---|---|
| Low stock alert not working | TBD — see Tier 1 | Top priority this session |
| ReportsPage bar labels show `Product #N` | `ReportsPage.tsx` `LowStockSection` | Same API now returns `product_name` — just substitute in the label, one line |
| SaleOrder create used raw customer ID | `SaleOrdersPage.tsx` | Being fixed in Tier 2, item 2 |

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
> See docs/NEXT_STEPS.md, docs/PROJECT_HANDOFF.md, and docs/PROJECT_PLAN.md (Phase 6) for full context — there's a prioritized backlog ready to execute.
>
> Next task: Start with Tier 1 — investigate and fix the low stock alert bug. Then move through Tier 2 (sale order form: customer dropdown + price auto-fill), Tier 3 (async polling on ship/receive), and Tier 4 (user management page, product detail page, dark mode) in order.
>
> Note: Tier 5 items (product picture, Celery Beat in production) are blocked on my decisions — don't start those until I confirm Cloudinary vs base64, and whether to deploy a second Render worker for Celery Beat.