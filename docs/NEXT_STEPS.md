# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 20)

- ✅ **Fixed the order-creation RBAC gap.** `PurchaseOrderPermission` and `SaleOrderPermission` were checking `orders.create_purchaseorder` / `orders.create_saleorder` — codenames that never existed anywhere (not Django defaults, not in `Meta.permissions`), meaning **no non-superuser could ever create a purchase or sale order via the API**. Fixed by switching both checks to `orders.add_purchaseorder` / `orders.add_saleorder`, which are Django's auto-generated default permissions and already existed in the DB — no migration required. Verified via shell: `Permission.objects.filter(codename='add_purchaseorder').exists()` → `True`.
- ✅ **Extended full Group-based RBAC to Warehouses.** New `apps/warehouses/permissions.py` (`WarehousePermission`) gates CRUD on `view_warehouse` / `add_warehouse` / `change_warehouse` / `delete_warehouse` (Django defaults, no migration). Wired into both `WarehouseListCreateView` and `WarehouseDetailView`, replacing `IsAuthenticatedOrReadOnly`. **Behavior change:** any authenticated user could previously write to warehouses; now requires the specific permission via Group assignment.
- ✅ **Extended full Group-based RBAC to Suppliers.** Same pattern — new `apps/suppliers/permissions.py` (`SupplierPermission`), gates on `view_supplier` / `add_supplier` / `change_supplier` / `delete_supplier` (Django defaults, no migration). Wired into both supplier views, replacing `IsAuthenticatedOrReadOnly`.
- ✅ **Extended RBAC to Stock In / Stock Out / Adjust.** Added `StockInOutPermission` (gates on existing `inventory.create_stock_transaction`) and `StockAdjustPermission` (gates on existing `inventory.adjust_stock`) to `apps/inventory/permissions.py`. Wired into `StockInView`, `StockOutView`, `AdjustStockView` in `apps/inventory/views.py`. **Behavior change:** `AdjustStockView` previously required only `is_staff=True` (`IsAdminUser`) — now requires the specific `adjust_stock` permission via Group. Any role that relied on `is_staff` alone for stock adjustment will need that permission granted explicitly once this ships.
- ✅ **Extended RBAC to Customer edit/deactivate.** `CustomerPermission` previously checked `request.user.role in ("admin", "manager")` directly, bypassing Groups entirely. Added a new custom permission `accounts.manage_customers` (`CustomUser.Meta.permissions`) and rewired `CustomerPermission` to check `request.user.has_perm("accounts.manage_customers")` instead. List/create remain open to any authenticated user (staff quick-add flow unaffected). **New migration:** `apps/accounts/migrations/0004_alter_customuser_options.py` — applied successfully.
- ✅ **Extended RBAC to Reports.** All 7 report views/viewsets (`InventoryValueReportView`, `LowStockReportView`, `CategorySummaryReportView`, `TransactionHistoryReportView`, `SalesReportEntryViewSet`, `PurchaseReportEntryViewSet`, `StockReportEntryViewSet`) previously used `IsAuthenticated` only — any logged-in user could see all reports. Added a single new permission `reports.view_reports` (`TransactionHistory.Meta.permissions`) and a new `apps/reports/permissions.py` (`ReportPermission`), applied to all 7. **New migration:** `apps/reports/migrations/0007_alter_transactionhistory_options.py` — applied successfully.
- ✅ **`python manage.py check` passes clean** (`System check identified no issues`) after all of the above edits — confirms every new permission class imports and loads correctly.
- 🔲 **Live endpoint verification not yet completed.** Attempted to smoke-test the new permission gates against the running dev server using a `teststaff@example.com` account, but the login call failed (`No active account found with the given credentials`) — most likely because the test user was never actually created (Django admin "Add user" form may not have saved, or password mismatch). Root-caused but not yet re-run to completion. **This is the first thing to finish next session** — see Immediate Next Actions below.
- 🔲 **Deliberately left `UserManagementView` on `IsAdminUser` (`is_staff`), NOT converted to Group-based permissions.** This endpoint can change any user's role or active status, including promoting to admin. Making it Group-assignable risks a misconfigured Group letting a non-admin escalate privileges — the existing self-protection guard only prevents locking yourself out, not escalating others. Explicit decision, documented here so it isn't "rediscovered" as a gap later. Revisit only if explicitly requested.
- 🔲 **ReportsPage low-stock label bug — still not applied**, carried over again from Session 19. See Immediate Next Actions.

---

## Current Architecture (Production)

| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel | https://inventory-management-system-liard-delta.vercel.app |
| Backend | Render | https://inventory-management-system-uet9.onrender.com |
| Database | Supabase PostgreSQL | Singapore region, session pooler |
| Cache/Queue | Upstash Redis | via REDIS_URL env var on Render |
| Uptime monitor | UptimeRobot | pings `/api/` every 5 min (Session 19) |

**Note:** all RBAC work this session was done and verified only against local dev (SQLite). Migrations have **not** yet been applied to the production Supabase database — do that as part of deployment, not before.

---

## Immediate Next Actions (in priority order)

### 1. Finish RBAC verification (started, not completed this session)
The login-based smoke test failed because the `teststaff@example.com` test user likely was never created. Next session, run this in `python manage.py shell` first to check:
```python
from apps.accounts.models import CustomUser
u = CustomUser.objects.filter(email="teststaff@example.com").first()
print(u, u.is_active if u else None, u.has_usable_password() if u else None)
```
If `None`, create directly via shell (bypasses admin form quirks):
```python
CustomUser.objects.create_user(
    email="teststaff@example.com", username="teststaff",
    first_name="Test", last_name="Staff",
    phone_number="+85512340000", password="testpass123", role="staff",
)
```
Then log in via `POST /api/v1/accounts/login/` and re-run the three-endpoint smoke test (warehouses POST, reports GET, products GET — all should 403 with no Group assigned). Then assign a Group with only `inventory.view_product` and confirm products flips to 200 while the others stay 403. This is the proof-of-correctness step for everything built this session — don't skip it.

### 2. Build the actual admin-panel Groups (Staff / Manager / Admin)
Once verification passes, create the real Groups at `/admin/auth/group/add/` using the complete permission table (see PROJECT_HANDOFF.md "RBAC / Permission Architecture" section for the full reference). Assign existing users to their appropriate Group.

### 3. Apply migrations to production
`accounts.0004_alter_customuser_options` and `reports.0007_alter_transactionhistory_options` need to run against Supabase before deploying the updated permission classes — otherwise `manage_customers`/`view_reports` won't exist there and every customer-edit/report request will 500 or silently deny everyone (`has_perm` on a nonexistent permission returns `False`, so it'll fail closed — safe, but breaks the feature until migrated).

### 4. Apply the ReportsPage low-stock label fix (small, still outstanding — 2 sessions running)
In `frontend/src/pages/reports/ReportsPage.tsx` — `LowStockSection`:
```tsx
// current:
<span className="w-28 truncate text-xs text-muted-foreground">Product #{item.product}</span>
// fix:
<span className="w-28 truncate text-xs text-muted-foreground">{item.product_name}</span>
```

### 5. Manual browser verification (carried over from Session 15, still outstanding)
- Open Sale Order form → `+` next to customer dropdown → create customer **without** phone number → confirm 201, modal closes, customer auto-selected, order submits end-to-end.
- Repeat **with** phone number to confirm no regression.
- Verify UsersPage: log in as admin → `/users` → change a role → confirm badge updates → toggle deactivate → confirm status changes.

### 6. Tier 4 Item 3 — Dark/light mode toggle (last Tier 4 item, unblocked)
- CSS vars for both themes already defined in `frontend/src/index.css` (`:root` and `.dark`).
- Add a toggle button in the Sidebar footer (below the user avatar block).
- Toggle adds/removes `.dark` class on `<html>` element.
- Persist preference in `localStorage` key `theme`.
- Load persisted preference on app boot (in `main.tsx` or a `useTheme` hook).
- No backend changes needed.

### 7. README screenshots + demo login (remaining polish items)
- Add screenshots of Dashboard, a Sale Order mid-lifecycle, and Reports — owner is adding these directly.
- Fill in a read-only demo login in the README before the interview.

---

## Blocked on Your Decisions

| Item | Decision needed |
|---|---|
| Product picture | Cloudinary (real hosting, needs API key) vs base64-in-DB (zero setup, slower) |
| Celery Beat in production | Second Render worker (cost/complexity) vs leave code-only, not running |

---

## Known Issues (carried over)

| Issue | Location | Status |
|---|---|---|
| ReportsPage bar labels show `Product #N` | `ReportsPage.tsx` `LowStockSection` | Open — fix identified, one line, not yet applied (3rd session carried) |
| Quick-create modal flow not manually verified in browser | `SaleOrdersPage.tsx` | Carried over from Session 15 — see Step 5 above |
| Polling hook has no unmount cleanup | `useOrderStatusPolling.ts` | Low-risk, optional follow-up |
| Warehouse column blank on Alerts/Dashboard low-stock | `AlertsPage.tsx`, `DashboardPage.tsx` | Deliberately deferred — do NOT fix unless asked |
| RBAC live-endpoint verification incomplete | backend, all new permission classes | **New this session** — see Immediate Next Action #1, must finish before building admin Groups |
| RBAC migrations not yet applied to production (Supabase) | `accounts.0004`, `reports.0007` | **New this session** — must apply before deploying |
| `UserManagementView` intentionally NOT Group-controlled | `apps/accounts/views.py` | **New this session** — deliberate security decision, not a bug, documented in RBAC section of PROJECT_HANDOFF.md |

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
> Session 20 just completed: extended full Group-based RBAC (Django admin panel) across Warehouses, Suppliers, Stock In/Out/Adjust, Customer management, and Reports — previously only Products/Categories/Orders were Group-controlled, everything else checked `is_staff` or `role` strings directly, bypassing the admin Groups UI entirely. Fixed a pre-existing bug where `add_purchaseorder`/`add_saleorder` permission codenames were misnamed, silently blocking ALL non-superusers from creating orders. Two new migrations applied locally (`accounts.0004`, `reports.0007`) for two new custom permissions (`manage_customers`, `view_reports`). `manage.py check` passes clean. Deliberately left `UserManagementView` on `is_staff`-only (not Group-controlled) as a security decision — role/active-status changes for other users is too high-risk to make Group-assignable.
>
> Next task: **finish RBAC verification** (a live-endpoint smoke test was attempted but failed because the test user login didn't work — needs to be re-run correctly), **then build the actual Staff/Manager/Admin Groups in `/admin/auth/group/add/`** using the complete permission table in PROJECT_HANDOFF.md, **then apply the two new migrations to production** before that code ships. After RBAC is fully closed out: the one-line ReportsPage low-stock label fix (still outstanding for a 3rd session running), the manual browser verification of the Sale Order quick-create-customer flow, then the dark/light mode toggle (Tier 4 Item 3, last unblocked item).
>
> Deliberately deferred (do NOT fix unless I ask): blank warehouse column on Alerts/Dashboard low-stock views.