# 📐 Project Scope — IMS Fullstack

## In Scope ✅

### Backend
- All existing endpoints (products, orders, reports, auth, warehouses, suppliers)
- CORS configuration for React frontend
- Standardized error response format
- Celery Beat schedule for low stock notifications
- Minor API improvements (warehouse required on stock endpoints)

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
- Low stock alerts list
- Reports (inventory value, low stock, category summary, transaction history)
- Role-based navigation (admin sees everything, staff sees limited menu)
- JWT auth with auto token refresh
- Responsive design (desktop + tablet)

### DevOps
- Frontend deployed to Vercel
- Backend already on Render (stays there)
- GitHub Actions optional (nice to have)

---

## Out of Scope ❌

- Mobile app (React Native)
- Real-time updates (WebSockets)
- Multi-language / i18n
- Dark mode
- Payment processing
- Barcode scanning
- PDF export of reports
- Email template customization
- Customer-facing portal
- Advanced analytics / BI
- Unit tests for frontend components (backend tests already done)

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

Everything else is bonus.

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
