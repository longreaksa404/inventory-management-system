# ▶️ Next Steps — Start Here

## What Was Done Last Session
- ✅ GitHub repo renamed to `inventory-management-system`
- ✅ New Render web service created at `https://inventory-management-system-uet9.onrender.com`
- ✅ New PostgreSQL database provisioned and connected
- ✅ All environment variables configured
- ✅ `build.sh` fixed — migrations + superuser creation now work reliably
- ✅ Admin panel fully working, superuser login confirmed

---

## Immediate Next Actions (in order)

### 1. Clean up old Render service
Delete the old `inventory-management-backend` web service on Render — it's no longer needed.
1. Go to Render dashboard → find `inventory-management-backend`
2. Settings → scroll to bottom → **Delete Web Service**
3. Type the name to confirm

**Do NOT delete the old database if it still exists — it may have data you want to keep.**

---

### 2. Run the full test suite locally
This has not been done yet. Do this before touching any code:

```cmd
cd C:\Users\acer\Documents\Reaksa\Code\Inventory\inventory-management-system
pipenv shell
set DJANGO_SETTINGS_MODULE=config.settings.test
pytest
```

Paste the results. Fix any failures before moving on. You want a green baseline before adding new features.

---

### 3. Add CORS to the backend
The React frontend needs CORS headers to make API calls to Django.

In a new Claude chat, say:
```
I need to add django-cors-headers to my Django backend so my React 
frontend at http://localhost:5173 can make API calls to http://localhost:8000.
I also want to configure it for the production Render URL:
https://inventory-management-system-uet9.onrender.com

My settings files are at config/settings/base.py, local.py, and production.py.
Show me exactly what to install and configure.
```

---

### 4. Set up monorepo structure
The plan is to keep frontend and backend in the same repo (`inventory-management-system`).

```
inventory-management-system/
├── backend/      ← move all current Django files here
├── frontend/     ← new React app goes here
├── docs/
└── README.md
```

Or keep backend at root and add `frontend/` subfolder — either works, just decide before scaffolding React.

In a new Claude chat, say:
```
I want to add a React frontend to my existing Django repo. The Django code 
is at the repo root. I want to create a frontend/ subfolder for the React app.
Should I restructure the repo or just add frontend/ at the root level?
My Render build command is ./build.sh — how does this affect the monorepo setup?
```

---

### 5. Scaffold the React frontend
Once CORS and repo structure are decided:

```
I want to scaffold a React + TypeScript + Vite frontend for my inventory 
management system inside a frontend/ folder. 

Use: TailwindCSS + shadcn/ui + React Query + React Router v6 + Axios + React Hook Form + Zod

Backend API: https://inventory-management-system-uet9.onrender.com/api/v1/ (production)
Local backend: http://localhost:8000/api/v1/

Auth: JWT — POST /api/v1/accounts/login/ returns {access, refresh}
All requests need Authorization: Bearer {token} header

Set up the project structure, configure all dependencies, build the axios 
instance with JWT interceptor (auto-refresh on 401), and build the login 
page end-to-end.
```

---

## Reference Documents

| Document | Purpose |
|---|---|
| `PROJECT_HANDOFF.md` | Complete state of the project — what's done, what's pending |
| `PROJECT_PLAN.md` | Phased roadmap for frontend + backend prep |
| `PROJECT_SCOPE.md` | What's in scope / out of scope, MVP definition |
| `NEXT_STEPS.md` | This file — immediate actions |

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
- Virtualenv: `C:\Users\acer\.virtualenvs\inventory-management-backend-lAitlqmP`
- Set settings: `set DJANGO_SETTINGS_MODULE=config.settings.local`
- Role values are lowercase: `"admin"`, `"manager"`, `"staff"`, `"customer"`
- Phone numbers must be `+855xxxxxxxxx` format
- Database free tier **expires July 16, 2026** — don't forget to renew or migrate data