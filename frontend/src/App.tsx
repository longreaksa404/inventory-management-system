// src/App.tsx
//
// Route definitions only — no business logic here.
// Every protected route goes through <ProtectedRoute> which handles the
// "not logged in → redirect to /login" check.
//
// Lazy imports: each page is code-split so the initial bundle only loads
// the login page. Dashboard, products etc. only download when navigated to.
// This keeps the first-paint fast — important for the Render cold-start scenario
// where the backend takes 30s to wake up; at least the UI loads instantly.

import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/routes/ProtectedRoute"
import PageLayout from "@/components/layout/PageLayout"

// Auth pages — not lazy because they're the entry point
import LoginPage from "@/pages/auth/LoginPage"

// Lazy-loaded app pages
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"))

// Fallback shown while a lazy chunk loads (tiny — stays out of the way)
function PageSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all sit inside the shared PageLayout shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PageLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Placeholder routes — add real pages as you build them */}
            <Route path="/products" element={<ComingSoon title="Products" />} />
            <Route path="/categories" element={<ComingSoon title="Categories" />} />
            <Route path="/warehouses" element={<ComingSoon title="Warehouses" />} />
            <Route path="/suppliers" element={<ComingSoon title="Suppliers" />} />
            <Route path="/orders/purchase" element={<ComingSoon title="Purchase Orders" />} />
            <Route path="/orders/sales" element={<ComingSoon title="Sale Orders" />} />
            <Route path="/stock" element={<ComingSoon title="Stock Transactions" />} />
            <Route path="/alerts" element={<ComingSoon title="Low Stock Alerts" />} />
            <Route path="/reports" element={<ComingSoon title="Reports" />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

// Temporary placeholder — replace with real page imports as you build them.
// Useful for interview demos: you can show the nav works before every page is built.
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  )
}