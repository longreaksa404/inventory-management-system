// src/pages/products/ProductDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { productsApi } from "@/api/products"
import type { TransactionType } from "@/types"

// ─── Transaction type badge ───────────────────────────────────────────────────

const TX_STYLES: Record<TransactionType, { label: string; className: string }> = {
  IN:  { label: "IN",  className: "bg-green-50 text-green-700" },
  OUT: { label: "OUT", className: "bg-red-50 text-red-600" },
  ADJ: { label: "ADJ", className: "bg-blue-50 text-blue-700" },
}

function TxBadge({ type }: { type: TransactionType }) {
  const { label, className } = TX_STYLES[type]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  active:        "bg-green-50 text-green-700",
  discontinued:  "bg-zinc-100 text-zinc-500",
  out_of_stock:  "bg-red-50 text-red-600",
}
const STATUS_LABELS = {
  active:        "Active",
  discontinued:  "Discontinued",
  out_of_stock:  "Out of stock",
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <span className="text-xs font-medium text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const productId = Number(id)
  const [txPage, setTxPage] = useState(1)

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getProduct(productId),
    enabled: !!productId,
  })

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ["stock-history", productId, txPage],
    queryFn: () => productsApi.getStockHistory(productId),
    enabled: !!productId,
  })

  const transactions = txData?.results ?? []
  const totalPages = txData ? Math.ceil(txData.count / 50) : 1

  // Stock health
  const stockRatio =
    product && product.reorder_level > 0
      ? product.quantity / product.reorder_level
      : 1
  const stockColor =
    product?.quantity === 0
      ? "bg-red-500"
      : stockRatio <= 1
      ? "bg-amber-400"
      : "bg-green-500"

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Back nav */}
      <button
        onClick={() => navigate("/products")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </button>

      {/* Product info card */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            {loadingProduct ? (
              <>
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-muted" />
              </>
            ) : (
              <>
                <h1 className="text-sm font-semibold truncate">{product?.name}</h1>
                <p className="text-xs text-muted-foreground font-mono">{product?.sku}</p>
              </>
            )}
          </div>
          {product && (
            <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[product.status]}`}>
              {STATUS_LABELS[product.status]}
            </span>
          )}
        </div>

        <div className="px-5 py-3">
          {loadingProduct ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b last:border-0">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : product ? (
            <>
              <InfoRow label="Category">{product.category_name}</InfoRow>
              <InfoRow label="Price">${Number(product.price).toFixed(2)}</InfoRow>
              <InfoRow label="Current stock">
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-semibold">{product.quantity}</span>
                  <div className="w-20 rounded-full bg-muted h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${stockColor}`}
                      style={{ width: `${Math.min(stockRatio * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </InfoRow>
              <InfoRow label="Reorder level">{product.reorder_level}</InfoRow>
              <InfoRow label="Stock ID">#{product.id}</InfoRow>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Product not found.</p>
          )}
        </div>
      </div>

      {/* Stock transaction history */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Stock transaction history
        </h2>
        <div className="rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Performed by</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {loadingTx ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {[12, 12, 24, 24, 32, 24].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-4 w-${w} animate-pulse rounded bg-muted`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">No transactions recorded for this product yet.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <TxBadge type={tx.transaction_type} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{tx.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.warehouse_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.performed_by_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tx.notes ? (
                        <span className="line-clamp-1">{tx.notes}</span>
                      ) : (
                        <span className="italic text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                      {new Date(tx.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {txPage} of {totalPages} · {txData?.count} transactions
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))}
                  disabled={txPage === totalPages}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}