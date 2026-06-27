// src/pages/reports/ReportsPage.tsx
import { useQuery } from "@tanstack/react-query"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { TrendingUp, Package, BarChart2, Clock } from "lucide-react"
import { reportsApi } from "@/api/reports"

// ─── Palette for pie chart ────────────────────────────────────────────────────

const PALETTE = [
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(338, 75%, 55%)",
  "hsl(24, 94%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(199, 89%, 48%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 65%, 52%)",
]

// ─── Section shell ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-5 py-3.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className={`animate-pulse rounded-lg bg-muted`} style={{ height }} />
  )
}

// ─── Inventory value section ──────────────────────────────────────────────────

function InventoryValueSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "inventory-value"],
    queryFn: reportsApi.getInventoryValue,
  })

  return (
    <Section title="Inventory Value" icon={TrendingUp}>
      {isLoading ? (
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      ) : (
        <div className="flex items-end gap-3">
          <p className="text-4xl font-semibold tabular-nums">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 2,
            }).format(Number(data?.total_value ?? 0))}
          </p>
          <p className="mb-1 text-sm text-muted-foreground">total across all products</p>
        </div>
      )}
    </Section>
  )
}

// ─── Category summary section ─────────────────────────────────────────────────

function CategorySection() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "category-summary"],
    queryFn: reportsApi.getCategorySummary,
  })

  const barData = (data ?? []).map((c) => ({
    name: c.category_name.length > 14 ? c.category_name.slice(0, 14) + "…" : c.category_name,
    value: Number(c.total_value ?? 0),
    qty: c.total_quantity ?? 0,
  }))

  const pieData = (data ?? []).map((c) => ({
    name: c.category_name,
    value: c.total_quantity ?? 0,
  }))

  return (
    <Section title="Category Summary" icon={BarChart2}>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : data?.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">No category data — add products to see charts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bar chart — value */}
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value by category ($)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                  formatter={(v: unknown) => [
                    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v)),
                    "Value",
                  ]}
                />
                <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart — quantity share */}
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity share</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => [`${v} units`, ""]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                      {value.length > 18 ? value.slice(0, 18) + "…" : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Section>
  )
}

// ─── Transaction history section ──────────────────────────────────────────────

function TransactionHistorySection() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "transaction-history"],
    queryFn: reportsApi.getTransactionHistory,
  })

  return (
    <Section title="Transaction History" icon={Clock}>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Order ID</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Party</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((tx, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      tx.transaction_type === "purchase"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700",
                    ].join(" ")}>
                      {tx.transaction_type === "purchase" ? "Purchase" : "Sale"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">#{tx.order_id}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {tx.transaction_type === "purchase" ? tx.supplier : tx.customer}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="capitalize text-muted-foreground">{tx.status}</span>
                  </td>
                  <td className="py-2.5 text-muted-foreground tabular-nums text-xs">
                    {new Date(tx.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

// ─── Low stock report section ─────────────────────────────────────────────────

function LowStockSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: reportsApi.getLowStock,
  })

  const sorted = [...(data ?? [])].sort((a, b) => {
    const ra = a.reorder_level > 0 ? a.quantity / a.reorder_level : 0
    const rb = b.reorder_level > 0 ? b.quantity / b.reorder_level : 0
    return ra - rb
  })

  return (
    <Section title="Low Stock Summary" icon={Package}>
      {isLoading ? (
        <ChartSkeleton height={140} />
      ) : sorted.length === 0 ? (
        <div className="flex h-24 items-center justify-center gap-2">
          <Package className="h-4 w-4 text-green-500" />
          <p className="text-sm text-muted-foreground">All products are sufficiently stocked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.slice(0, 10).map((item, i) => {
            const ratio = item.reorder_level > 0 ? item.quantity / item.reorder_level : 1
            const pct = Math.min(Math.round(ratio * 100), 100)
            const barClass = item.quantity === 0 ? "bg-red-500" : ratio <= 0.5 ? "bg-red-400" : "bg-amber-400"
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs text-muted-foreground">Product #{item.product}</span>
                <div className="flex-1 rounded-full bg-muted h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right text-xs tabular-nums font-medium">
                  {item.quantity} / {item.reorder_level}
                </span>
              </div>
            )
          })}
          {sorted.length > 10 && (
            <p className="text-xs text-muted-foreground mt-2">+{sorted.length - 10} more — see Alerts page for full list</p>
          )}
        </div>
      )}
    </Section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Live snapshots pulled directly from your inventory data
        </p>
      </div>

      <InventoryValueSection />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LowStockSection />
        <div className="lg:col-span-1">
          <CategorySection />
        </div>
      </div>

      <TransactionHistorySection />
    </div>
  )
}