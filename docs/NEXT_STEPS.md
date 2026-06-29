# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 10)

- ✅ Deployed frontend to Vercel: https://inventory-management-system-liard-delta.vercel.app
- ✅ Added `frontend/vercel.json` with SPA rewrite rule to fix React Router 404 on refresh
- ✅ Installed `sonner` toast library (`npm install sonner`) — NOT yet wired in, deferred to next session
- ✅ Deleted old Render PostgreSQL (`inventory-db`) — no longer needed, migrated to Supabase
- ✅ Updated `CORS_ALLOWED_ORIGINS` on Render with Vercel URL

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

### 1. Wire sonner toast notifications
`sonner` is already installed. Just needs to be wired in.

**Step 1 — `frontend/src/main.tsx`:**
Add these two changes (file is ready in docs/NEXT_STEPS.md):
```tsx
import { Toaster } from "sonner"
// inside JSX before </StrictMode>:
<Toaster richColors position="top-right" closeButton />
```

**Step 2 — Add `import { toast } from "sonner"` to each page and add onSuccess/onError:**

Pages that need toasts (all mutations):
- `src/pages/products/ProductsPage.tsx` — create, update, delete
- `src/pages/categories/CategoriesPage.tsx` — create, update, delete
- `src/pages/warehouses/WarehousesPage.tsx` — create, update, delete
- `src/pages/suppliers/SuppliersPage.tsx` — create, update, delete
- `src/pages/stock/StockPage.tsx` — stock in, stock out, adjust
- `src/pages/orders/PurchaseOrdersPage.tsx` — create, confirm, receive
- `src/pages/orders/SaleOrdersPage.tsx` — create, confirm, ship, invoice

**Pattern to use in every mutation:**
```tsx
const createMutation = useMutation({
  mutationFn: productsApi.createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] })
    toast.success("Product created successfully")
    onClose()
  },
  onError: () => {
    toast.error("Failed to create product. Please try again.")
  },
})
```

### 2. Fix Product/Warehouse names in AlertsPage and Dashboard
Both pages show `Product #N` / `Warehouse #N` instead of real names.
The `/reports/low-stock/` API returns raw IDs only.

**Two options:**
- **Backend fix (cleaner):** Update `LowStockReportView` in `backend/apps/reports/views.py` to join product name and warehouse name in the response
- **Frontend fix (faster):** In AlertsPage and DashboardPage, fetch all products + warehouses and build a lookup map

Recommended: backend fix. Change the response shape to include `product_name` and `warehouse_name`.

### 3. README polish for portfolio
- Add live demo URL (Vercel)
- Add screenshots of Dashboard, Products, Orders pages
- Add tech stack badges
- Add "How to run locally" section for both backend and frontend
- Record optional 2-min demo video

### 4. SaleOrder create form UX improvement
Currently uses a raw numeric customer ID field — poor UX.
Requires a customer list endpoint or filtering users by role=customer.
Low priority — can stay as-is for portfolio.

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
> Key decisions: React Query, React Hook Form + Zod v4 (no generic on useForm),
> Context + useReducer for auth, Axios + JWT interceptors, sonner installed but not yet wired.
>
> See docs/NEXT_STEPS.md and docs/PROJECT_HANDOFF.md for full context.
>
> Next task: Wire sonner toast notifications across all mutation pages, then fix
> Product/Warehouse names in AlertsPage and Dashboard, then README polish.