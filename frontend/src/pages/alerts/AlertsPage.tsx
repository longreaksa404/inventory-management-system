// src/pages/alerts/AlertsPage.tsx
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { reportsApi } from "@/api/reports"

// ─── Severity indicator ───────────────────────────────────────────────────────

function SeverityBar({ quantity, reorderLevel }: { quantity: number; reorderLevel: number }) {
  // 0 = critical, approaching reorder = warning
  const ratio = reorderLevel > 0 ? quantity / reorderLevel : 1
  const { barClass, labelClass, label } = ratio === 0
    ? { barClass: "bg-red-500", labelClass: "text-red-600", label: "Out of stock" }
    : ratio <= 0.5
    ? { barClass: "bg-red-400", labelClass: "text-red-500", label: "Critical" }
    : { barClass: "bg-amber-400", labelClass: "text-amber-600", label: "Low" }

  const pct = Math.min(Math.round(ratio * 100), 100)

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 rounded-full bg-muted h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${labelClass}`}>{label}</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: reportsApi.getLowStock,
  })

  // Sort: out of stock first, then by ratio (worst first)
  const sorted = [...(alerts ?? [])].sort((a, b) => {
    const ra = a.reorder_level > 0 ? a.quantity / a.reorder_level : 0
    const rb = b.reorder_level > 0 ? b.quantity / b.reorder_level : 0
    return ra - rb
  })

  const critical = sorted.filter((a) => a.reorder_level > 0 && a.quantity / a.reorder_level <= 0.5).length
  const outOfStock = sorted.filter((a) => a.quantity === 0).length

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Low Stock Alerts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {alerts?.length ?? 0} products need attention
          </p>
        </div>
        {!isLoading && sorted.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            {outOfStock > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {outOfStock} out of stock
              </span>
            )}
            {critical > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {critical} critical
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Warehouse</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">In stock</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Reorder at</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Severity</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[28, 24, 12, 12, 28].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className={`h-4 w-${w} animate-pulse rounded bg-muted`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-green-50 p-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">All products are sufficiently stocked</p>
                    <p className="text-xs text-muted-foreground">Alerts appear here when stock falls at or below the reorder level</p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((alert, i) => (
                <tr
                  key={i}
                  className={[
                    "border-b last:border-0 transition-colors",
                    alert.quantity === 0 ? "bg-red-50/40" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-3 font-medium">Product #{alert.product}</td>
                  <td className="px-4 py-3 text-muted-foreground">Warehouse #{alert.warehouse}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={alert.quantity === 0 ? "font-semibold text-red-600" : "font-medium"}>
                      {alert.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {alert.reorder_level}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBar quantity={alert.quantity} reorderLevel={alert.reorder_level} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Create a purchase order to restock critical items. Stock levels update automatically when orders are received.
        </p>
      )}
    </div>
  )
}