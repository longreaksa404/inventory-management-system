// src/App.tsx
import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/routes/ProtectedRoute"
import AdminRoute from "@/routes/AdminRoute"
import PageLayout from "@/components/layout/PageLayout"
import LoginPage from "@/pages/auth/LoginPage"

const DashboardPage       = lazy(() => import("@/pages/dashboard/DashboardPage"))
const ProductsPage        = lazy(() => import("@/pages/products/ProductsPage"))
const ProductDetailPage   = lazy(() => import("@/pages/products/ProductDetailPage"))
const CategoriesPage      = lazy(() => import("@/pages/categories/CategoriesPage"))
const WarehousesPage      = lazy(() => import("@/pages/warehouses/WarehousesPage"))
const SuppliersPage       = lazy(() => import("@/pages/suppliers/SuppliersPage"))
const StockPage           = lazy(() => import("@/pages/stock/StockPage"))
const PurchaseOrdersPage  = lazy(() => import("@/pages/orders/PurchaseOrdersPage"))
const SaleOrdersPage      = lazy(() => import("@/pages/orders/SaleOrdersPage"))
const AlertsPage          = lazy(() => import("@/pages/alerts/AlertsPage"))
const ReportsPage         = lazy(() => import("@/pages/reports/ReportsPage"))
const CustomersPage       = lazy(() => import("@/pages/customers/CustomersPage"))
const UsersPage           = lazy(() => import("@/pages/users/UsersPage"))

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

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PageLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/products"        element={<ProductsPage />} />
            <Route path="/products/:id"    element={<ProductDetailPage />} />
            <Route path="/categories"      element={<CategoriesPage />} />
            <Route path="/warehouses"      element={<WarehousesPage />} />
            <Route path="/suppliers"       element={<SuppliersPage />} />
            <Route path="/stock"           element={<StockPage />} />
            <Route path="/orders/purchase" element={<PurchaseOrdersPage />} />
            <Route path="/orders/sales"    element={<SaleOrdersPage />} />
            <Route path="/alerts"          element={<AlertsPage />} />
            <Route path="/reports"         element={<ReportsPage />} />
            <Route path="/customers"       element={<CustomersPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/users"         element={<UsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}