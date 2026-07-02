# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 19)

- ✅ **Verified the `is_active` gap from Session 18 is already resolved in the live repo.** Checked `UserListSerializer.Meta.fields` in `apps/accounts/serializers.py` — `is_active` is present. Checked the `User` interface in `frontend/src/types/index.ts` — `is_active: boolean` is present. No code change needed; this was a stale item carried over in this file. Closing it out.
- ✅ **README.md rewritten for interview readiness.** Removed the "Architecture Highlights" deep-dive and the placeholder "Screenshots" section (owner's call — kept the README leaner). Added: GitHub source link in the Live Demo table, and a new "API Basics" section (auth flow, token lifetimes, role values, pagination shape, warehouse-required stock mutation rule) pulled from the locked project facts. Confirmed live backend URL as `https://inventory-management-system-uet9.onrender.com` (the old README had a stale/different Render URL — that discrepancy is now resolved, this is the canonical one going forward).
- ✅ **Tier 5 — UptimeRobot monitor configured.** Created an HTTP(s) monitor pointed at `https://inventory-management-system-uet9.onrender.com/api/` (the DB-free `health_check` view in `backend/api/urls.py`), 5-minute interval (fastest on free plan), email alerts on, no delay/no repeat. This keeps the Render free-tier backend from sleeping so it doesn't cold-start during the interview demo. **Action for owner:** confirm in the UptimeRobot dashboard that the monitor shows "Up" with logged response times before relying on it.
- 🔲 **ReportsPage low-stock label bug — discussed but NOT yet applied.** `LowStockSection` in `frontend/src/pages/reports/ReportsPage.tsx` still renders `Product #{item.product}` (the numeric ID) instead of `{item.product_name}`. Location and fix confirmed, one-line change, low risk — just hasn't been made yet. Still open, see Immediate Next Actions below.

---

## Current Architecture (Production)

| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel | https://inventory-management-system-liard-delta.vercel.app |
| Backend | Render | https://inventory-management-system-uet9.onrender.com |
| Database | Supabase PostgreSQL | Singapore region, session pooler |
| Cache/Queue | Upstash Redis | via REDIS_URL env var on Render |
| Uptime monitor | UptimeRobot | pings `/api/` every 5 min (Session 19) |

---

## Immediate Next Actions (in priority order)

### 1. Apply the ReportsPage low-stock label fix (small, still outstanding)
In `frontend/src/pages/reports/ReportsPage.tsx` — `LowStockSection`:
```tsx
// current:
<span className="w-28 truncate text-xs text-muted-foreground">Product #{item.product}</span>
// fix:
<span className="w-28 truncate text-xs text-muted-foreground">{item.product_name}</span>
```
`LowStockItem.product_name` is already returned by the API and already typed — no backend or type changes needed.

### 2. Confirm the UptimeRobot monitor is actually live
Check the dashboard for "Up" status with response times logged, then cold-load the Swagger URL to confirm no more 30–60s wake-up delay.

### 3. Manual browser verification (carried over from Session 15, still outstanding)
- Open Sale Order form → `+` next to customer dropdown → create customer **without** phone number → confirm 201, modal closes, customer auto-selected, order submits end-to-end.
- Repeat **with** phone number to confirm no regression.
- Verify UsersPage: log in as admin → `/users` → change a role → confirm badge updates → toggle deactivate → confirm status changes.

### 4. Tier 4 Item 3 — Dark/light mode toggle (last Tier 4 item, unblocked)
- CSS vars for both themes already defined in `frontend/src/index.css` (`:root` and `.dark`).
- Add a toggle button in the Sidebar footer (below the user avatar block).
- Toggle adds/removes `.dark` class on `<html>` element.
- Persist preference in `localStorage` key `theme`.
- Load persisted preference on app boot (in `main.tsx` or a `useTheme` hook).
- No backend changes needed.

### 5. README screenshots + demo login (remaining polish items)
- Add screenshots of Dashboard, a Sale Order mid-lifecycle, and Reports — owner is adding these directly.
- Fill in a read-only demo login in the README before the interview.

---

## Blocked on Your Decisions

| Item | Decision needed |
|---|---|
| Product picture | Cloudinary (real hosting, needs API key) vs base64-in-DB (zero setup, slower) |
| Celery Beat in production | Second Render worker (cost/complexity) vs leave code-only, not running |

*(Uptime Robot removed from this table — resolved in Session 19.)*

---

## Known Issues (carried over)

| Issue | Location | Status |
|---|---|---|
| Warehouse column blank on Alerts/Dashboard low-stock | `AlertsPage.tsx`, `DashboardPage.tsx` | Deliberately deferred — do NOT fix unless asked |
| ReportsPage bar labels show `Product #N` | `ReportsPage.tsx` `LowStockSection` | Open — fix identified, one line, not yet applied — see Step 1 above |
| Polling hook has no unmount cleanup | `useOrderStatusPolling.ts` | Low-risk, optional follow-up |
| Quick-create modal flow not manually verified in browser | `SaleOrdersPage.tsx` | Carried over from Session 15 — see Step 3 above |

*(`is_active` missing from `UserListSerializer`/`User` type — removed from this table. Verified already fixed in Session 19.)*

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
> - GitHub: https://github.com/longreaksa404/inventory-management-system
>
> See docs/NEXT_STEPS.md, docs/PROJECT_HANDOFF.md, and docs/PROJECT_PLAN.md (Phase 6) for full context.
>
> Session 19 just completed: verified the is_active gap from Session 18 was already fixed (no code change needed), rewrote README.md for interview readiness (removed Architecture Highlights + Screenshots sections per owner preference, added GitHub link + API Basics section, confirmed canonical Render URL), and configured an UptimeRobot monitor on the `/api/` health-check endpoint (5-min interval) to prevent Render free-tier cold starts during the interview demo.
>
> Next task: apply the one-line ReportsPage low-stock label fix (Product #{item.product} → {item.product_name}), confirm the UptimeRobot monitor shows "Up", do the manual browser verification of the Sale Order quick-create-customer flow, then build the dark/light mode toggle (Tier 4 Item 3, last unblocked item). After that: add real screenshots + demo login to the README, and the two blocked Tier 5 items (product picture, Celery Beat) pending decisions on storage backend and worker deployment.
>
> Deliberately deferred (do NOT fix unless I ask): blank warehouse column on Alerts/Dashboard low-stock views.