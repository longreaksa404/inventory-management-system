# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 3)
- ✅ Installed `django-cors-headers==4.9.0`
- ✅ Added `corsheaders` to `INSTALLED_APPS` and `CorsMiddleware` to `MIDDLEWARE`
- ✅ CORS config block added to `base.py` (`CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `CORS_ALLOW_HEADERS`)
- ✅ `CORS_ALLOW_ALL_ORIGINS = True` added to `local.py` for local dev
- ✅ `CORS_ALLOWED_ORIGINS` + Vercel regex added to `production.py`
- ✅ `dj-database-url` added to `requirements.txt` (was missing)
- ✅ `python manage.py check` passes clean — `System check identified no issues`
- ✅ Committed and pushed to main → Render auto-deployed with CORS active

---

## Immediate Next Actions (in order)

### 1. Run the full test suite
This has not been run against the new virtualenv yet. Do this first before touching any code:

```cmd
cd C:\Users\acer\Documents\Reaksa\Code\Inventory\inventory-management-system
pipenv shell
set DJANGO_SETTINGS_MODULE=config.settings.test
pytest
```

Paste the results. Fix any failures before moving to the frontend. You want a green baseline.

---

### 2. Scaffold the React frontend

The backend is now frontend-ready. Start the React app inside a `frontend/` subfolder at the repo root.

Paste this into the new chat to give Claude full context:

```
I'm building a React frontend for my Inventory Management System (IMS).
Read PROJECT_HANDOFF.md for full project context.

Backend API: http://localhost:8000/api/v1/ (local) 
             https://inventory-management-system-uet9.onrender.com/api/v1/ (production)
CORS is already configured on the backend.

Stack:
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui
- React Query (TanStack Query v5)
- React Router v6
- Axios (with JWT interceptor — auto-refresh on 401)
- React Hook Form + Zod

Auth:
- POST /api/v1/accounts/login/ → { access, refresh }
- Access token lifetime: 2 hours
- Refresh token lifetime: 7 days
- All requests need: Authorization: Bearer {token}

Frontend location: frontend/ subfolder at repo root (Django backend stays at root)

Task: Scaffold the full project structure, configure all dependencies, 
build the Axios instance with JWT interceptor (auto-refresh on 401), 
and build the Login page end-to-end (form → API call → store token → redirect to dashboard).
```

---

### 3. Pages to build (in order after scaffold + auth)

| Priority | Page | API endpoint(s) |
|---|---|---|
| 1 | Dashboard | `/reports/inventory-value/`, `/reports/low-stock/`, `/reports/category-summary/` |
| 2 | Products | `/inventory/products/` (list, create, edit, delete) |
| 3 | Categories | `/inventory/categories/` |
| 4 | Warehouses | `/api/v1/warehouses/` |
| 5 | Suppliers | `/api/v1/suppliers/` |
| 6 | Stock Transactions | `/inventory/transactions/`, stock in/out/adjust |
| 7 | Purchase Orders | `/orders/purchase-orders/` (create → confirm → receive) |
| 8 | Sale Orders | `/orders/sales/` (create → confirm → ship → invoice) |
| 9 | Reports | `/reports/transaction-history/`, `/reports/category-summary/` |
| 10 | Low Stock Alerts | `/inventory/low-stock-alerts/` |

---

### 4. Add CORS_ALLOWED_ORIGINS on Render (after Vercel deploy)

Once the frontend is deployed to Vercel, add the real URL to Render:

```
CORS_ALLOWED_ORIGINS=https://your-actual-app.vercel.app
```

The `*.vercel.app` regex in `production.py` already covers preview deployments automatically.

---

## Key URLs

| Resource | URL |
|---|---|
| Live API | https://inventory-management-system-uet9.onrender.com |
| Swagger | https://inventory-management-system-uet9.onrender.com/swagger/ |
| Admin | https://inventory-management-system-uet9.onrender.com/admin/ |
| GitHub | https://github.com/longreaksa404/inventory-management-system |

---

## Important Reminders for Next Chat

- Local folder: `C:\Users\acer\Documents\Reaksa\Code\Inventory\inventory-management-system`
- Active virtualenv: `C:\Users\acer\.virtualenvs\inventory-management-system-y9v2OP1d` (Python 3.11.4)
- Activate with: `pipenv shell`
- Settings for local: `set DJANGO_SETTINGS_MODULE=config.settings.local`
- Settings for tests: `set DJANGO_SETTINGS_MODULE=config.settings.test`
- Role values are lowercase: `"admin"`, `"manager"`, `"staff"`, `"customer"`
- Phone numbers must be `+855xxxxxxxxx` format
- All list endpoints paginate: `{ count, next, previous, results[] }`
- Stock endpoints need `warehouse` ID in request body
- Database free tier **expires July 16, 2026**
- Frontend will live at `frontend/` subfolder — backend stays at repo root