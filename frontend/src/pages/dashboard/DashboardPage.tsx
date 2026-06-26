// src/pages/dashboard/DashboardPage.tsx
import { useQuery } from "@tanstack/react-query"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { TrendingUp, Package, AlertTriangle, ShoppingCart, Receipt } from "lucide-react"
import { reportsApi } from "@/api/reports"
import { productsApi } from "@/api/products"
import { ordersApi } from "@/api/orders"
import { useAuth } from "@/hooks/useAuth"

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  isLoading?: boolean
  accent?: "default" | "warning" | "danger"
}

function KpiCard({ label, value, sub, icon: Icon, isLoading, accent = "default" }: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-3 h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  const accentBg = {
    default: "bg-foreground/5",
    warning: "bg-amber-50 dark:bg-amber-950/30",
    danger: "bg-red-50 dark:bg-red-950/30",
  }[accent]

  const iconColor = {
    default: "text-foreground/60",
    warning: "text-amber-500",
    danger: "text-red-500",
  }[accent]

  const valueColor = {
    default: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  }[accent]

  return (
    <div className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`rounded-md p-1.5 ${accentBg}`}>
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
      {sub && (
        <p className={`mt-1 text-xs ${accent === "default" ? "text-muted-foreground" : iconColor}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.first_name || user?.username || "there"

  const { data: inventoryValue, isLoading: loadingValue } = useQuery({
    queryKey: ["reports", "inventory-value"],
    queryFn: reportsApi.getInventoryValue,
  })

  const { data: productsPage, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: () => productsApi.getProducts({ page: 1 }),
  })

  const { data: lowStockItems, isLoading: loadingLowStock } = useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: reportsApi.getLowStock,
  })

  const { data: purchaseDraft, isLoading: loadingPO } = useQuery({
    queryKey: ["orders", "purchase", { status: "draft" }],
    queryFn: () => ordersApi.getPurchaseOrders({ status: "draft" }),
  })

  const { data: saleDraft, isLoading: loadingSO } = useQuery({
    queryKey: ["orders", "sales", { status: "draft" }],
    queryFn: () => ordersApi.getSaleOrders({ status: "draft" }),
  })

  const { data: categorySummary, isLoading: loadingCategories } = useQuery({
    queryKey: ["reports", "category-summary"],
    queryFn: reportsApi.getCategorySummary,
  })

  const formattedValue =
    inventoryValue?.total_value != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(Number(inventoryValue.total_value))
      : "$0"

  const lowStockCount = lowStockItems?.length ?? 0
  const pendingPO = purchaseDraft?.count ?? 0
  const pendingSO = saleDraft?.count ?? 0

  const chartData =
    categorySummary?.map((c) => ({
      name: c.category_name.length > 14 ? c.category_name.slice(0, 14) + "…" : c.category_name,
      value: Number(c.total_value ?? 0),
      qty: c.total_quantity,
    })) ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Good {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening in your warehouse today.
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      {/* KPI grid */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Inventory Value" value={formattedValue} icon={TrendingUp} isLoading={loadingValue} />
          <KpiCard label="Total Products" value={productsPage?.count ?? 0} icon={Package} isLoading={loadingProducts} />
          <KpiCard label="Low Stock" value={lowStockCount} sub={lowStockCount > 0 ? "Need reordering" : "All good"} icon={AlertTriangle} isLoading={loadingLowStock} accent={lowStockCount > 0 ? "danger" : "default"} />
          <KpiCard label="Pending POs" value={pendingPO} sub={pendingPO > 0 ? "Awaiting confirmation" : "None pending"} icon={ShoppingCart} isLoading={loadingPO} accent={pendingPO > 0 ? "warning" : "default"} />
          <KpiCard label="Pending SOs" value={pendingSO} sub={pendingSO > 0 ? "Awaiting confirmation" : "None pending"} icon={Receipt} isLoading={loadingSO} accent={pendingSO > 0 ? "warning" : "default"} />
        </div>
      </section>

      {/* Chart + low stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Inventory value by category
          </h2>
          <div className="rounded-xl border bg-card p-5">
            {loadingCategories ? (
              <div className="h-48 animate-pulse rounded-lg bg-muted" />
            ) : chartData.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2">
                <Package className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No products yet — add some to see chart data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    formatter={(value: unknown) => [new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value)), "Value"]}
                  />
                  <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Low stock alerts
          </h2>
          <div className="rounded-xl border bg-card">
            {loadingLowStock ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}
              </div>
            ) : lowStockCount === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2">
                <div className="rounded-full bg-green-50 p-2 dark:bg-green-950/30">
                  <AlertTriangle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-medium">All stocked up</p>
                <p className="text-xs text-muted-foreground">No alerts right now</p>
              </div>
            ) : (
              <div className="divide-y">
                {lowStockItems?.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-medium">Product #{item.product}</p>
                      <p className="text-[10px] text-muted-foreground">Warehouse #{item.warehouse}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-red-500">{item.quantity}</p>
                      <p className="text-[10px] text-muted-foreground">/ {item.reorder_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}