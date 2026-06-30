# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 17)

- ✅ **Ran the Customer test suite against the live repo** (as instructed at the end of Session 16) — **68 passed, 5 failed**, all 5 failures from the same root cause.
- 🐛 **Found and fixed a real production bug, not a test bug.** `CustomUserManager.create_user()` (in `apps/accounts/models.py`) unconditionally requires a `phone_number` for every non-superuser account. `CustomerSerializer` treats `phone_number` as optional (model field is `blank=True, default=''`), and customer records never log in, so there was never a reason to enforce a phone for them — but the manager's guard predates the Customer feature (Session 15) and was never updated to account for it. Result: **any customer created without a phone number 500'd** instead of either succeeding or returning a clean 400. This would have hit real users immediately — the "+ New customer" quick-create form in `SaleOrdersPage.tsx` doesn't require a phone number, so any staff member quick-adding a customer without one would have silently failed with an Internal Server Error.
  - **Fix:** `create_user()` now also exempts `role == 'customer'` from the phone requirement, alongside the existing `is_superuser` exemption. Patch delivered as `backend/apps/accounts/models_create_user_patch.py` — paste the `create_user` method over the existing one in `apps/accounts/models.py` inside `CustomUserManager`. No other part of the file changes.
  - **Failed tests, now expected to pass once the patch is applied:** `test_admin_can_create_customer`, `test_role_cannot_be_overridden_from_input`, `test_username_falls_back_to_email_when_not_provided`, `test_username_explicit_value_is_respected`, `test_created_customer_has_unusable_password`. All five omitted `phone_number` in the request body, which is exactly the legitimate path the quick-create form uses.
- ⚠️ **Not done yet:** applying the patch to the real `apps/accounts/models.py` and re-running the suite to confirm all 73 tests pass. Also still outstanding: the manual browser verification of the Sale Order quick-create-customer modal flow (carried over from Session 15/16) — this bug makes that check even more important, since it's likely the exact path that would have surfaced this in the browser as a 500 toast.

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

### 1. Apply the phone_number patch (blocking everything else)
- Open `apps/accounts/models.py`, find `CustomUserManager.create_user()`, replace it with the version in `backend/apps/accounts/models_create_user_patch.py`.
- Re-run: `pytest tests/api/test_api_customers.py -v` — expect 14/14 passing in that file, 73/73 in the full suite.
- No migration needed — this is pure Python logic in the manager, not a schema change.

### 2. Manual browser verification (carried over from Session 15/16, now higher priority)
- Open the Sale Order form → "+ New customer" → submit **without** a phone number → confirm it now succeeds (pre-patch this would have 500'd) → confirm the modal closes, the new customer is auto-selected via `setValue("customer", customer.id)`, and the sale order submits end-to-end.
- Also test the same flow **with** a phone number to confirm no regression.

### Tier 1 — ✅ DONE (Session 13)
Low stock alert bug fully diagnosed and fixed.

### Tier 2 — ✅ DONE (Session 14–15)
Sale Order form UX: price auto-fill verified correct; customer dropdown changed to name + phone.

### Tier 3 — ✅ DONE (Session 14)
Async polling after Ship/Receive (`useOrderStatusPolling` hook, used in both order pages).

### Customer management — ✅ DONE (Session 15), test coverage ✅ DONE (Session 16), phone_number bug found + fix delivered (Session 17, not yet applied)

### Tier 4 — New pages (start once steps 1–2 above are confirmed)
**1. User management page**
- Backend: add `PATCH /api/v1/accounts/{id}/` accepting `{role}` and/or `{is_active}`, admin-only permission
- Frontend: new page at `/users`, admin-only route guard, hidden from sidebar for non-admins
- Table: name, email, role badge, active/inactive toggle, date joined
- Search/filter by name or email
- Not started yet
- Note: this is a *different* endpoint/page from the existing Customer management — `/accounts/{id}/` (any role) vs `/accounts/customers/{id}/` (customers only). Don't conflate them.

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
| **Customer creation without a phone number 500s** | `apps/accounts/models.py` `CustomUserManager.create_user()` | **NEW, found Session 17 via the test suite — fix written (`models_create_user_patch.py`) but not yet applied to the live repo. This is a real bug affecting the quick-create-customer flow used from the Sale Order form, not just a test issue.** |
| Quick-create modal flow not yet manually verified end-to-end in browser | `SaleOrdersPage.tsx` | Carried over from Session 15/16 — higher priority now given the bug above |

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
> Session 17 just completed: ran the new `test_api_customers.py` suite against the real repo — 68 passed, 5 failed, all five from the same root cause. Found a real bug: `CustomUserManager.create_user()` requires a `phone_number` for every non-superuser account, but `CustomerSerializer` treats phone as optional and customer accounts never log in, so creating a customer without a phone number 500s. This is a real production bug, not just a test gap — the Sale Order "+ New customer" quick-create form doesn't require a phone, so this would hit real users. Fix delivered as `backend/apps/accounts/models_create_user_patch.py` (exempt `role == 'customer'` from the phone requirement, same way superusers are already exempt) but not yet applied to the actual repo file.
>
> Next task: apply that patch to `apps/accounts/models.py`, re-run the full test suite to confirm 73/73 pass, then do the manual browser check of the Sale Order quick-create-customer flow — test both with and without a phone number, since the bug specifically affects the no-phone path. After both are confirmed, move to Tier 4 in order: user management page (admin-only, different from customer management — don't conflate the two), product detail page, dark mode toggle.
>
> Tier 5 items (product picture, Celery Beat in production) are still blocked on my decisions — don't start those until I confirm Cloudinary vs base64, and whether to deploy a second Render worker for Celery Beat.
>
> Also note: the blank "Warehouse" column on the Low Stock Alerts page is a known, deliberately-deferred side effect of the Tier 1 fix — do not "fix" it unless I explicitly ask.