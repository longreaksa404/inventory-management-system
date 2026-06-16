# ▶️ Next Steps — Start Here

## Immediate Next Actions (in order)

### 1. Apply all backend fixes to GitHub
All bug fixes from the previous session need to be applied to your local repo
(if not already done) and pushed:

```cmd
cd inventory-management-backend
git add .
git commit -m "fix: apply comprehensive bug fixes from code review session"
git push
```

### 2. Confirm server runs locally
```cmd
pipenv shell
set DJANGO_SETTINGS_MODULE=config.settings.local
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
Visit http://127.0.0.1:8000/swagger/ — should show all endpoints.

### 3. Run the test suite
```cmd
pytest
```
All tests should pass. Fix any that don't before starting frontend.

### 4. Add CORS to backend (first backend prep task)
In a new Claude chat, say:
```
I need to add django-cors-headers to my Django backend so my React 
frontend at http://localhost:5173 can make API calls to http://localhost:8000.
I also want to add it to the production settings for the Vercel frontend URL.
Show me exactly what to install and configure.
```

### 5. Start the frontend
In a new Claude chat, say:
```
I want to scaffold a React + TypeScript + Vite frontend for my inventory 
management system. Use TailwindCSS + shadcn/ui + React Query + React Router v6 
+ Axios + React Hook Form + Zod. 

The backend API is at http://localhost:8000/api/v1/ locally.
Auth: JWT — POST /api/v1/accounts/login/ returns {access, refresh}.
All requests need Authorization: Bearer {token} header.

Set up the project structure, configure all dependencies, build the axios 
instance with JWT interceptor, and build the login page end-to-end.
```

---

## Reference Documents in This Handoff Package

| Document | Purpose |
|---|---|
| `PROJECT_HANDOFF.md` | Complete state of the project — what's done, what's pending |
| `PROJECT_PLAN.md` | Phased roadmap for frontend + backend prep |
| `PROJECT_SCOPE.md` | What's in scope / out of scope, MVP definition |
| `CLAUDE_INSTRUCTIONS.md` | How to prompt Claude effectively in new chats per phase |
| `NEXT_STEPS.md` | This file — immediate actions |

---

## Recommended Order of New Chats

1. **Chat 1 — Backend Prep**: CORS, error response standardization, Celery Beat schedule
2. **Chat 2 — Frontend Foundation**: Vite + TS + Tailwind + shadcn/ui setup, axios + JWT interceptor, login page
3. **Chat 3 — Dashboard + Products**: Dashboard KPIs, Products CRUD page
4. **Chat 4 — Warehouses + Suppliers + Stock**: Remaining CRUD pages + stock transactions
5. **Chat 5 — Purchase Orders**: Full lifecycle UI
6. **Chat 6 — Sale Orders**: Full lifecycle UI
7. **Chat 7 — Reports Dashboard**: Charts + reports pages
8. **Chat 8 — Deploy + Polish**: Vercel deployment, README, screenshots

Each chat should start with the prompt template from `CLAUDE_INSTRUCTIONS.md` and reference `PROJECT_HANDOFF.md` for context.
