# 📐 Project Scope — IMS Fullstack

## In Scope ✅

### Backend
- All existing endpoints (products, orders, reports, auth, warehouses, suppliers)
- CORS configuration for React frontend
- Standardized error response format
- Celery Beat schedule for low stock notifications (code-level; production scheduling decision pending — see Open Decisions)
- Minor API improvements (warehouse required on stock endpoints)
- `?role=` query param filter on AccountsView (customer list for sale order form)
- `PATCH /accounts/{id}/` endpoint for role + is_active management
- Low stock alert bug fix (root cause TBD — investigate before estimating)
- Product image field (storage backend TBD — see Open Decisions)

### Frontend
- Login / Register pages
- Dashboard with KPIs and charts
- Products CRUD (list, create, edit, delete, search, filter)
- Categories CRUD
- Warehouses CRUD
- Suppliers CRUD
- Stock transactions (in / out / adjust)
- Purchase orders (create, confirm, receive lifecycle)
- Sale orders (create, confirm, ship, invoice lifecycle)
  - Customer dropdown with display label (e.g. "John Doe — CT0007") replacing raw numeric ID input
  - Price auto-fill from product price on line item selection (stays editable)
- Low stock alerts list (with real product/warehouse names — done Session 11)
- Reports (inventory value, low stock, category summary, transaction history)
- Role-based navigation (admin sees everything, staff sees limited menu)
- JWT auth with auto token refresh
- Responsive design (desktop + tablet)
- Async polling after Ship/Receive actions so order status updates without manual refresh
- User management page (admin-only): list users, change role, toggle active/inactive
- Product detail page: full product info + stock transaction history
- Dark/light mode toggle with persistence

### DevOps
- Frontend deployed to Vercel
- Backend already on Render (stays there)
- GitHub Actions optional (nice to have)
- Uptime Robot monitor on backend health endpoint (manual setup, no code — prevents Render free-tier sleep)

---

## Out of Scope ❌

- Mobile app (React Native)
- Real-time updates (WebSockets)
- Multi-language / i18n
- Payment processing
- Barcode scanning
- PDF export of reports
- Email template customization
- Customer-facing portal
- Advanced analytics / BI
- Unit tests for frontend components (backend tests already done)
- Per-warehouse stock tracking (would require a `ProductWarehouseStock` through-table — schema change, deferred to roadmap)
- Pricing events / discount engine (e.g. seasonal % discounts, bulk-quantity discounts) — scoped as a real feature with model + admin CRUD + calculation logic, deliberately deferred to roadmap rather than partially built before deadline
- Django permission groups / granular permission UI in the frontend — stays in Django admin, not rebuilt in React

---

## Open Decisions (blocking specific items)

| Item | Decision needed | Status |
|---|---|---|
| Product picture storage | Cloudinary (real hosting, needs API key) vs base64-in-DB (zero setup, slower) | ⏳ Waiting on answer |
| Celery Beat in production | Deploy a second Render worker (cost/complexity) vs leave Beat code-only / not running in production | ⏳ Waiting on answer |

---

## MVP Definition

The project is "done enough for interviews" when:

1. ✅ Backend fully bug-fixed and running
2. ✅ Frontend auth flow works (login → dashboard → logout)
3. ✅ Products page works (list, create, edit, delete)
4. ✅ At least one order lifecycle works end-to-end (sale order: create → confirm → ship)
5. ✅ Dashboard shows real data from the API
6. ✅ Deployed live (frontend on Vercel, backend on Render)
7. ✅ README has screenshots and live demo link

Everything else is bonus — including the new backlog items above, which are scoped but not required for "done enough."

---

## Success Metrics

| Metric | Target |
|---|---|
| Pages built | 10+ |
| API endpoints consumed | 20+ |
| Backend test coverage | 80%+ |
| Lighthouse performance score | 80+ |
| Live demo URL | Yes |
| Mobile responsive | Yes (tablet minimum) |
| GitHub commits | Clean history, feature branches |