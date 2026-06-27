# ▶️ Next Steps — Start Here

## What Was Done Last Session (Session 8)

- ✅ Built StockPage (`src/pages/stock/StockPage.tsx`) — paginated transaction list with IN/OUT/ADJ color badges, product/warehouse/type filters, Stock In / Stock Out / Adjust modals. Adjust hidden for non-admins via `isAdmin` from `useAuth()`.
- ✅ Built PurchaseOrdersPage (`src/pages/orders/PurchaseOrdersPage.tsx`) — paginated list, expandable row with item detail, create order form with dynamic item array (useFieldArray), confirm + receive lifecycle with confirmation dialogs.
- ✅ Built SaleOrdersPage (`src/pages/orders/SaleOrdersPage.tsx`) — same pattern as PO page, confirm + ship + invoice lifecycle, discount field per item, stock-check error surfaced from API.
- ✅ Built AlertsPage (`src/pages/alerts/AlertsPage.tsx`) — read-only list sorted by severity (out of stock → critical → low), severity bar with ratio-based width, summary badges in header.
- ✅ Built ReportsPage (`src/pages/reports/ReportsPage.tsx`) — 4 sections: inventory value, low stock summary with bar indicators, category bar + pie charts (recharts), transaction history table.
- ✅ Updated App.tsx — all 10 routes wired, no more ComingSoon placeholders.

---

## Current Folder Structure (frontend/src) — COMPLETE STATE

```
frontend/src/
├── api/
│   ├── client.ts         ✅
│   ├── auth.ts           ✅
│   ├── products.ts       ✅
│   ├── warehouses.ts     ✅
│   ├── suppliers.ts      ✅
│   ├── orders.ts         ✅
│   └── reports.ts        ✅
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx   ✅
│   │   ├── Navbar.tsx    ✅
│   │   └── PageLayout.tsx ✅
│   └── ui/
│       └── button.tsx    ✅
├── hooks/
│   └── useAuth.ts        ✅
├── lib/
│   └── utils.ts          ✅
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx          ✅
│   ├── dashboard/
│   │   └── DashboardPage.tsx      ✅
│   ├── products/
│   │   └── ProductsPage.tsx       ✅
│   ├── categories/
│   │   └── CategoriesPage.tsx     ✅
│   ├── warehouses/
│   │   └── WarehousesPage.tsx     ✅
│   ├── suppliers/
│   │   └── SuppliersPage.tsx      ✅
│   ├── stock/
│   │   └── StockPage.tsx          ✅
│   ├── orders/
│   │   ├── PurchaseOrdersPage.tsx ✅
│   │   └── SaleOrdersPage.tsx     ✅
│   ├── alerts/
│   │   └── AlertsPage.tsx         ✅
│   └── reports/
│       └── ReportsPage.tsx        ✅
├── routes/
│   └── ProtectedRoute.tsx  ✅
├── stores/
│   └── authStore.tsx       ✅
├── types/
│   └── index.ts            ✅
├── App.tsx                 ✅ (all 10 routes live)
├── App.css                 ✅
├── index.css               ✅
└── main.tsx                ✅
```

---

## Pages Status

| Page | Status |
|---|---|
| Login | ✅ Done |
| Dashboard | ✅ Done |
| Products | ✅ Done |
| Categories | ✅ Done |
| Warehouses | ✅ Done |
| Suppliers | ✅ Done |
| Stock Transactions | ✅ Done |
| Purchase Orders | ✅ Done |
| Sale Orders | ✅ Done |
| Low Stock Alerts | ✅ Done |
| Reports | ✅ Done |

**All pages are complete. The MVP is feature-complete.**

---

## Immediate Next Actions (in priority order)

### 1. Deploy frontend to Vercel
- Push everything to GitHub
- Connect repo to Vercel (root: `frontend`, build: `npm run build`, output: `dist`)
- Set env var: `VITE_API_URL=https://inventory-management-system-uet9.onrender.com`
- After deploy, update `CORS_ALLOWED_ORIGINS` on Render to include the Vercel URL

### 2. Fix Dashboard low stock panel to show names not IDs
The current dashboard low stock panel shows `Product #N` and `Warehouse #N`.
Now that AlertsPage is built and working, this should resolve by fetching
the full low stock alert list from the reports API which already includes names via
the serializer — OR wire up the existing `/reports/low-stock/` API response to also
join product/warehouse names. Best quick fix: just link to AlertsPage from the dashboard panel.

### 3. Add toast notifications (success/error feedback)
Currently mutations succeed silently. Add a lightweight toast.
Options:
- `sonner` (1.5kb, works great with Tailwind) → `npm install sonner`
- Add `<Toaster />` in main.tsx, then `toast.success("Order confirmed.")` in each `onSuccess` callback.

### 4. README polish for portfolio
- Add screenshots of each page
- Add live demo link
- Add "Tech Stack" section
- Record optional 2-min demo video

### 5. Optional improvements (bonus)
- Replace `Product #N` / `Warehouse #N` in AlertsPage with real names (requires joining against products/warehouses queries)
- Add `useFieldArray` validation messages per row in PO/SO create forms
- Purchase Orders: add `?page=` + `?search=` to filter bar
- Sale Orders: same

---

## Opening Message for Next Chat Session

Paste this at the start of the next conversation:

> I'm building an IMS fullstack portfolio project.
> Backend: Django + DRF (deployed on Render).
> Frontend: React + TypeScript + Vite + TailwindCSS + shadcn/ui.
>
> All 10 pages are now complete (auth, dashboard, products, categories,
> warehouses, suppliers, stock transactions, purchase orders, sale orders,
> low stock alerts, reports).
>
> Key decisions: React Query, React Hook Form + Zod v4 (no generic on useForm),
> Context + useReducer for auth, Axios + JWT interceptors.
>
> See docs/NEXT_STEPS.md for full context.
>
> Next task: Deploy frontend to Vercel. Then add toast notifications with sonner.
> Then fix the dashboard low stock panel to show product names instead of IDs.