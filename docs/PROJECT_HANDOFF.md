# 📦 Inventory Management System — Project Handoff

## What This Document Is
Complete handoff for continuing development of the IMS backend + React frontend. Read this before starting any new chat session.

---

## 🏗️ Project Overview

**Type:** Full-stack Inventory Management System
**Goal:** Portfolio project for fullstack developer interviews
**Stack:** Django + DRF (backend) + React + TypeScript (frontend)
**Live Frontend:** https://inventory-management-system-liard-delta.vercel.app
**Live Backend:** https://inventory-management-system-uet9.onrender.com
**Swagger Docs:** https://inventory-management-system-uet9.onrender.com/swagger/
**Admin Panel:** https://inventory-management-system-uet9.onrender.com/admin/
**GitHub:** https://github.com/longreaksa404/inventory-management-system

---

## 🗄️ Database Architecture

|
 Environment 
|
 Database 
|
 Location 
|
|
---
|
---
|
---
|
|
 Local dev 
|
 SQLite 
|
`backend/db.sqlite3`
|
|
 Production 
|
 PostgreSQL 
|
 Supabase (Singapore, session pooler) 
|

**Supabase project ID:** `nducnhxvrzxdeucrijeu`
**Connection type:** Session Pooler (NOT Direct — Render is IPv4-only)

---

## 🗂️ Monorepo Structure (current + planned)

```
inventory-management-system/
├── backend/
│   ├── apps/
│   │   ├── reports/views.py          ✅ LowStockReportView includes product_name + warehouse_name
│   │   ├── accounts/views.py         🆕 planned: PATCH endpoint + ?role= filter (Phase 6)
│   │   └── ...
│   └── ...
└── frontend/
    ├── vercel.json                   ✅ SPA rewrite rule
    └── src/
        ├── api/                      ✅ all done
        ├── components/                ✅ all done
        ├── hooks/                     ✅
        ├── lib/                       ✅
        ├── pages/
        │   ├── auth/                  ✅
        │   ├── dashboard/              ✅ real product/warehouse names
        │   ├── products/               ✅ list/CRUD done; detail page 🆕 planned (Phase 6)
        │   ├── categories/             ✅
        │   ├── warehouses/             ✅
        │   ├── suppliers/              ✅
        │   ├── stock/                  ✅
        │   ├── orders/                 ✅ planned: customer dropdown, price auto-fill, polling (Phase 6)
        │   ├── alerts/                 ✅ real names; underlying bug still being fixed (Phase 6 Tier 1)
        │   ├── reports/                ✅ minor: LowStockSection labels still show Product #N
        │   └── users/                  🆕 planned (Phase 6 Tier 4)
        ├── routes/                     ✅
        ├── stores/                     ✅
        ├── types/                      ✅
        └── App.tsx                     ✅ will need new /users and /products/:id routes
```

---

## ✅ Session History

- **Session 1** — Backend bug fixes
- **Session 2** — Infrastructure (Render deploy)
- **Session 3** — CORS
- **Session 4** — Deploy fixes + tests green (50/50)
- **Session 5** — Frontend scaffolding + API layer
- **Session 6** — Auth flow + Dashboard + Products page
- **Session 7** — Categories, Warehouses, Suppliers pages
- **Session 8** — Stock, PurchaseOrders, SaleOrders, Alerts, Reports pages + App.tsx wired
- **Session 9** — Fixed Render Root Directory, migrated DB to Supabase, set up DBeaver
- **Session 10** — Deployed frontend to Vercel, added vercel.json SPA fix, deleted old Render PostgreSQL
- **Session 11** — Fixed Product #N / Warehouse #N display: updated LowStockReportView (backend), LowStockItem type, AlertsPage, DashboardPage
- **Session 12** — Reviewed and prioritized full new backlog (10 items: low stock bug, customer dropdown, price auto-fill, async polling, user management, product detail, dark mode, product pictures, Celery Beat, Uptime Robot). Updated PROJECT_SCOPE.md and PROJECT_PLAN.md (new Phase 6) to reflect the backlog. No code changes this session — planning only.

---

## 📊 Frontend Pages Status

|
 Page 
|
 Status 
|
 Notes 
|
|
---
|
---
|
---
|
|
 Login 
|
 ✅ Done 
|
|
|
 Dashboard 
|
 ✅ Done 
|
 Low stock panel shows real names 
|
|
 Products 
|
 ✅ Done 
|
 Detail page planned (Phase 6) 
|
|
 Categories 
|
 ✅ Done 
|
|
|
 Warehouses 
|
 ✅ Done 
|
|
|
 Suppliers 
|
 ✅ Done 
|
|
|
 Stock Transactions 
|
 ✅ Done 
|
|
|
 Purchase Orders 
|
 ✅ Done 
|
 Async polling planned (Phase 6) 
|
|
 Sale Orders 
|
 ✅ Done 
|
 Customer dropdown + price auto-fill planned (Phase 6) 
|
|
 Low Stock Alerts 
|
 ✅ Done (display) 
|
 Underlying alert trigger bug still open (Phase 6 Tier 1) 
|
|
 Reports 
|
 ✅ Done 
|
 Minor: LowStockSection labels still show Product #N 
|
|
 User management 
|
 🆕 Planned 
|
 Phase 6 Tier 4 
|
|
 Product detail 
|
 🆕 Planned 
|
 Phase 6 Tier 4 
|

---

## 🔐 Role System

|
 Role 
|
 Stored Value 
|
 Access Level 
|
|
---
|
---
|
---
|
|
 Admin 
|
`"admin"`
|
 Full access incl. stock adjust, planned: user management 
|
|
 Manager 
|
`"manager"`
|
 Warehouse + stock oversight 
|
|
 Staff 
|
`"staff"`
|
 Orders, stock in/out 
|
|
 Customer 
|
`"customer"`
|
 Sales orders only — will be listable via 
`?role=customer`
 filter (Phase 6) 
|

---

## ⚠️ Critical Pattern — Zod v4 + zodResolver

```tsx
// ✅ CORRECT — no generic on useForm
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
})
const onSubmit = handleSubmit((values) => { myMutation.mutate(values) })
```

---

## 🎨 Established UI Patterns

|
 Pattern 
|
 Implementation 
|
|
---
|
---
|
|
 Empty optional field 
|
`<span className="italic text-muted-foreground/50">—</span>`
|
|
 Skeleton loading rows 
|
`Array.from({ length: N }).map((_, i) => ...)`
 with animate-pulse 
|
|
 Search debounce 
|
`let searchTimeout = 0`
 + 
`window.setTimeout(..., 400)`
|
|
 Modal scroll 
|
`max-h-[90vh] overflow-y-auto`
 on modal container 
|
|
 Action buttons 
|
 edit: 
`hover:bg-muted`
, delete: 
`hover:bg-red-50 hover:text-red-500`
|
|
 Primary button 
|
`bg-foreground text-background hover:opacity-90`
|
|
 Danger button 
|
`bg-red-500 text-white hover:bg-red-600`
|
|
 Dynamic form rows 
|
`useFieldArray`
 from react-hook-form 
|
|
 Expandable table row 
|
 local 
`useState(false)`
 per row, 
`ChevronDown/Up`
 icon toggle 
|
|
 Stock type badge 
|
 IN=green-50/green-700, OUT=red-50/red-600, ADJ=blue-50/blue-700 
|
|
 Order status badge 
|
 per-status config object mapping status → label + className 
|
|
 Severity bar 
|
 ratio-based width %, red/amber fill based on qty/reorder_level 
|
|
 Truncating name cells 
|
`min-w-0 flex-1 truncate`
 on the text container 
|
|
 Display-only derived ID 
|
 compute in render, e.g. 
`CT${String(id).padStart(4, '0')}`
, never store or submit it (planned, Phase 6) 
|
|
 Polling after async action 
|
 refetch every 2s for ~15s post-202, or until status changes (planned, Phase 6) 
|

---

## ⚙️ Local Dev Commands (PowerShell)

```powershell
# Backend
cd backend
pipenv shell
$env:DJANGO_SETTINGS_MODULE="config.settings.local"
python manage.py runserver

# Frontend
cd frontend
npm run dev

# Backend: http://127.0.0.1:8000
# Frontend: http://localhost:5173
```

---

## ⚠️ Known Issues / Open Items

1. **Low stock alert not triggering correctly** — root cause not yet diagnosed, top priority next session
2. ReportsPage `LowStockSection` bar labels still show `Product #N` — one-line fix, low priority
3. SaleOrder create form uses raw numeric customer ID — fix planned (Phase 6 Tier 2)
4. Two decisions blocking Tier 5 items: product picture storage (Cloudinary vs base64), Celery Beat production deployment (second worker vs code-only)
5. README still needs full portfolio polish (screenshots, live URLs, tech badges, local dev section)

---

## 📌 See Also

- `docs/PROJECT_SCOPE.md` — full in-scope/out-of-scope list including new backlog items and "Open Decisions" table
- `docs/PROJECT_PLAN.md` — Phase 6 has the tiered backlog breakdown
- `docs/NEXT_STEPS.md` — session-by-session action items, always the most current "what to do right now"