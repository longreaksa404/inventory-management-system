# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 4)

- ✅ Fixed `pywin32==312` in `requirements.txt` (Windows-only package, broke Render Linux build)
- ✅ Fixed double stock application bug in `apps/inventory/models.py`
  - `increase_stock`, `decrease_stock`, `adjust_stock` were both updating quantity directly AND creating a `StockTransaction` (which also calls `apply_transaction`)
  - Fix: when `user + warehouse` provided, delegate entirely to `StockTransaction`; when not, update directly
- ✅ Added `gunicorn==23.0.0` and `whitenoise==6.9.0` to `requirements.txt`
- ✅ Ran full pytest suite — **50/50 passing**
- ✅ Backend successfully deployed on Render 🎉
- ✅ Live at: https://inventory-management-system-uet9.onrender.com

---

## Immediate Next Actions (in order)

### 1. Scaffold the React frontend

Create the frontend inside a `frontend/` subfolder at repo root:

```cmd
cd C:\Users\acer\Documents\Reaksa\Code\Inventory\inventory-management-system
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

Install all dependencies:

```cmd
npm install axios @tanstack/react-query react-router-dom react-hook-form zod @hookform/resolvers recharts
npm install -D tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

### 2. Build in this order

| Step | What | Why first |
|---|---|---|
| 1 | Axios instance + JWT interceptor | Everything depends on this |
| 2 | Auth store (token storage) | Login needs it |
| 3 | Login page | Can't access anything without it |
| 4 | Protected route wrapper | Guards all other pages |
| 5 | Dashboard layout + sidebar | Shell for all pages |
| 6 | Dashboard page (KPIs + charts) | Shows real data immediately |
| 7 | Products CRUD | Core feature |
| 8 | Orders lifecycle | Key business logic |
| 9 | Reports | Final polish |

### 3. Add CORS_ALLOWED_ORIGINS on Render (after Vercel deploy)

Once frontend is deployed to Vercel, add the real URL to Render env vars:

```
CORS_ALLOWED_ORIGINS=https://your-actual-app.vercel.app
```

The `*.vercel.app` regex in `production.py` already covers preview deployments.

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
- Backend test command: `set DJANGO_SETTINGS_MODULE=config.settings.test && pytest`
- Role values are lowercase: `"admin"`, `"manager"`, `"staff"`, `"customer"`
- Phone numbers must be `+855xxxxxxxxx` format
- All list endpoints paginate: `{ count, next, previous, results[] }`
- Stock endpoints need `warehouse` ID in request body
- Database free tier **expires July 16, 2026** — upgrade or recreate before then
- Frontend will live at `frontend/` subfolder — backend stays at repo root
- To avoid vim in git: run `git config --global core.editor "code --wait"` to use VS Code as git editor