# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 13)

- ✅ **Tier 1 COMPLETE — Low stock alert bug fully diagnosed and fixed.** Turned out to be two separate bugs:
  - **Bug B (frontend-facing, fixed first):** `LowStockReportView` (`apps/reports/views.py`) computed "stock" by summing `PurchaseOrderItem` minus `SaleOrderItem` quantities — completely ignoring `Product.quantity`, the real authoritative stock field mutated by `StockTransaction` (Stock In/Out/Adjust). Any product whose stock moved outside order items was invisible or wrong. Rewrote it to query `Product.objects.filter(quantity__lte=F('reorder_level'))` directly, matching the logic already correct in `notify_low_stock` and `generate_inventory_report`. Verified live on `/alerts` — now shows accurate products (Drilling Machine, Road Roller, Crane Truck) with correct quantities.
  - **Bug A (backend alert lifecycle):** `SaleOrder.ship()` (`apps/orders/models.py`) used `LowStockAlert.objects.get_or_create(...)`, which — combined with `unique_together = ("product", "warehouse")` — meant the alert row froze at its first-ever quantity/reorder_level and never updated on subsequent ships. Changed to `update_or_create` so the row refreshes every time, and the `post_save` signal (email + `StockReportEntry`) re-fires correctly as stock keeps dropping.
- ✅ Added test coverage:
  - `backend/tests/api/test_api_reports.py` — 3 tests validating `LowStockReportView` reads `Product.quantity` directly and ignores order-item history
  - `backend/tests/domain/orders/test_low_stock_alert_refresh.py` — validates `LowStockAlert` updates (not duplicates) across repeated ships
- ✅ All 50+ existing tests still pass — no regressions
- ✅ **Local dev workflow fix:** `backend/manage.py` default changed from `config.settings.development` → `config.settings.local`. Root cause: `config.settings.development` has no `CORS_ALLOWED_ORIGINS` set (empty list by default), so the browser silently blocked the CORS preflight on login — only `OPTIONS` requests ever reached the server, never the real `POST`. `config.settings.local` already has `CORS_ALLOW_ALL_ORIGINS = True` and SQLite, so it's the correct default for local work. **This does NOT affect production** — Render sets `DJANGO_SETTINGS_MODULE=config.settings.production` explicitly via `render.yaml`, and `config/wsgi.py` has its own separate untouched default of `config.settings.production`. `manage.py`'s `setdefault()` only applies when the env var isn't already set, so production is protected by two independent layers.
- ⚠️ **Known limitation, deliberately NOT fixed this session:** `LowStockReportView` now always returns `warehouse: null, warehouse_name: null`, since `Product.quantity` is global, not per-warehouse-scoped. The frontend `AlertsPage.tsx`/`DashboardPage.tsx` Warehouse column now renders blank. **Explicitly deferred** — user decided not to fix this (no column removal, no null handling). If revisited later: either drop the Warehouse column from `AlertsPage.tsx`/`DashboardPage.tsx`, or implement true per-warehouse stock tracking (already scoped as a Tier 6 / roadmap item — `ProductWarehouseStock` through-table — in `PROJECT_SCOPE.md`).

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

### Tier 1 — ✅ DONE (this session)
~~Fix low stock alert not triggering~~ — see summary above.

### Tier 2 — Sale Order form UX
**Re-verify, likely already done:** Reviewing the current `SaleOrdersPage.tsx` and `apps/accounts/views.py`, both items below appear to already be implemented:
1. ~~Customer dropdown with CT00XX label~~ — `AccountsView` already supports `?role=` filter, `authApi.getUsersByRole`, and `CreateSOForm` already renders a `<select>` with `"{first_name} {last_name} — CT{id padded}"` labels.
2. ~~Price auto-fill on sale order line items~~ — `handleProductSelect` in `CreateSOForm` already auto-fills `unit_price` from the selected product, stays editable.

**Action for next session: confirm both work correctly in the browser, then mark fully done.** No code changes expected here unless testing reveals a gap.

### Tier 3 — Order lifecycle UX
**Async polling after Ship/Receive**
- After `ordersApi.shipSaleOrder()` / `ordersApi.receivePurchaseOrder()` returns 202, poll the order detail every 2s for ~15s (or until status changes) instead of a single `invalidateQueries` call
- Applies to both `PurchaseOrdersPage.tsx` and `SaleOrdersPage.tsx`
- Not started yet

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
- Per-warehouse stock tracking (would also resolve the blank Warehouse column in Tier 1's deferred item above)
- Pricing events / discount engine (seasonal %, bulk discount rules)
- README should mention these as "Future Work" — good interview signal for deliberate scoping

---

## Known Issues (carried over)

| Issue | Location | Notes |
|---|---|---|
| Low stock alert not working | ~~TBD~~ | ✅ FIXED this session (Tier 1) |
| Warehouse column blank on Alerts/Dashboard low-stock views | `AlertsPage.tsx`, `DashboardPage.tsx` | Known side-effect of Tier 1 fix, explicitly deferred per user decision |
| ReportsPage bar labels show `Product #N` | `ReportsPage.tsx` `LowStockSection` | Still open — same API now returns `product_name`, just substitute in the label, one line |
| Local dev required explicit `$env:DJANGO_SETTINGS_MODULE` every session | `manage.py` | ✅ FIXED this session — default changed to `config.settings.local` |

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
> Session 13 just completed: Tier 1 (low stock alert bug) is fully fixed and tested — see NEXT_STEPS.md summary. Local dev now defaults to `config.settings.local` automatically (no more manual env var).
>
> Next task: Start with Tier 2 — re-verify the customer dropdown and price auto-fill on the Sale Order form actually work in the browser (code looks already done, just needs confirming). Then move to Tier 3 (async polling on ship/receive), and Tier 4 (user management page, product detail page, dark mode) in order.
>
> Note: Tier 5 items (product picture, Celery Beat in production) are blocked on my decisions — don't start those until I confirm Cloudinary vs base64, and whether to deploy a second Render worker for Celery Beat.
>
> Also note: the blank "Warehouse" column on the Low Stock Alerts page is a known, deliberately-deferred side effect of the Tier 1 fix — do not "fix" it unless I explicitly ask.