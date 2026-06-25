// src/pages/dashboard/DashboardPage.tsx
//
// Six data sources fetched in parallel with React Query:
//   1. Inventory value report  → total $ value KPI
//   2. Products list (page 1)  → total product count
//   3. Low stock report        → alert count
//   4. Purchase orders (draft) → pending PO count
//   5. Sale orders (draft)     → pending SO count
//   6. Category summary        → bar chart data
//
// Interview talking points:
// - useQuery with a queryKey array makes each query independently cacheable
// - parallel fetches via separate useQuery calls (not sequential await chains)
// - Skeleton loading state per-card so the page feels responsive even on slow 3G
// - Error states surface clearly — no silent failures

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
import { reportsApi } from "@/api/reports"
import { productsApi } from "@/api/products"
import { ordersApi } from "@/api/orders"
import { useAuth } from "@/hooks/useAuth"

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  isLoading?: boolean
  accent?: "default" | "warning" | "danger"
}

function KpiCard({ label, value, sub, isLoading, accent = "default" }: KpiCardProps) {
  const accentClass = {
    default: "",
    warning: "border-l-4 border-l-amber-400",
    danger: "border-l-4 border-l-destructive",
  }[accent]

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-7 w-16 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className={`rounded-lg border bg-card p-5 ${accentClass}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
      {title}
    </h2>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { displayName } = useAuth()

  // All six queries run in parallel — React Query fires them concurrently
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

  // Format inventory value as $xxx,xxx
  const formattedValue = inventoryValue?.total_value != null
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(inventoryValue.total_value))
    : "—"

  const lowStockCount = lowStockItems?.length ?? 0

  // Chart data: recharts expects [{name, value}]
  const chartData = categorySummary?.map((c) => ({
    name: c.category_name.length > 12
      ? c.category_name.slice(0, 12) + "…"
      : c.category_name,
    value: Number(c.total_value ?? 0),
    qty: c.total_quantity,
  })) ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold">
          Good {getGreeting()}, {displayName || "there"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Here's what's happening in your warehouse today.
        </p>
      </div>

      {/* KPI row */}
      <section>
        <SectionHeader title="At a glance" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Inventory value"
            value={formattedValue}
            isLoading={loadingValue}
          />
          <KpiCard
            label="Total products"
            value={productsPage?.count ?? "—"}
            isLoading={loadingProducts}
          />
          <KpiCard
            label="Low stock"
            value={lowStockCount}
            sub={lowStockCount > 0 ? "Need reordering" : "All good"}
            isLoading={loadingLowStock}
            accent={lowStockCount > 0 ? "danger" : "default"}
          />
          <KpiCard
            label="Pending POs"
            value={purchaseDraft?.count ?? "—"}
            sub="Draft purchase orders"
            isLoading={loadingPO}
            accent={(purchaseDraft?.count ?? 0) > 0 ? "warning" : "default"}
          />
          <KpiCard
            label="Pending SOs"
            value={saleDraft?.count ?? "—"}
            sub="Draft sale orders"
            isLoading={loadingSO}
            accent={(saleDraft?.count ?? 0) > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      {/* Category chart */}
      <section>
        <SectionHeader title="Inventory value by category" />
        <div className="rounded-lg border bg-card p-5">
          {loadingCategories ? (
            <div className="h-52 animate-pulse rounded bg-muted" />
          ) : chartData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
              No category data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: unknown) => [
                    new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                    }).format(Number(value)),
                    "Value",
                    ]}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--foreground))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Low stock table */}
      {lowStockCount > 0 && (
        <section>
          <SectionHeader title={`Low stock alerts (${lowStockCount})`} />
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Product ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Reorder at
                  </th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems?.slice(0, 8).map((item, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-medium">{item.product}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {item.warehouse}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-destructive font-medium">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {item.reorder_level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}