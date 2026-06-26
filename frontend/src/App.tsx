// src/App.tsx
import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/routes/ProtectedRoute"
import PageLayout from "@/components/layout/PageLayout"
import LoginPage from "@/pages/auth/LoginPage"

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"))
const ProductsPage = lazy(() => import("@/pages/products/ProductsPage"))
const CategoriesPage = lazy(() => import("@/pages/categories/CategoriesPage"))

function PageSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PageLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
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