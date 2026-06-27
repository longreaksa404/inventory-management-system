// src/pages/stock/StockPage.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp,
} from "lucide-react"
import { productsApi } from "@/api/products"
import { warehousesApi } from "@/api/warehouses"
import { useAuth } from "@/hooks/useAuth"
import type { TransactionType } from "@/types"

// ─── Transaction type badge ───────────────────────────────────────────────────

function TxBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, { label: string; className: string }> = {
    IN:  { label: "IN",  className: "bg-green-50 text-green-700" },
    OUT: { label: "OUT", className: "bg-red-50 text-red-600" },
    ADJ: { label: "ADJ", className: "bg-blue-50 text-blue-700" },
  }
  const { label, className } = map[type]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}

// ─── Shared form controls ─────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Input({ hasError, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className={[
        "flex h-8 w-full rounded-lg border bg-background px-3 text-sm outline-none",
        "placeholder:text-muted-foreground/50 transition-colors",
        "focus:border-ring focus:ring-2 focus:ring-ring/20",
        hasError ? "border-red-400" : "border-input",
      ].join(" ")}
      {...props}
    />
  )
}

function SelectInput({ hasError, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <select
      className={[
        "flex h-8 w-full rounded-lg border bg-background px-3 text-sm outline-none",
        "transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20",
        hasError ? "border-red-400" : "border-input",
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  )
}

function Textarea({ hasError, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      rows={2}
      className={[
        "flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none resize-none",
        "placeholder:text-muted-foreground/50 transition-colors",
        "focus:border-ring focus:ring-2 focus:ring-ring/20",
        hasError ? "border-red-400" : "border-input",
      ].join(" ")}
      {...props}
    />
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card shadow-xl mx-4">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Stock In / Out form ──────────────────────────────────────────────────────

const stockMutationSchema = z.object({
  product: z.coerce.number().min(1, "Select a product"),
  warehouse: z.coerce.number().min(1, "Select a warehouse"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
})

function StockMutationForm({
  mode,
  onClose,
}: {
  mode: "IN" | "OUT"
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const { data: productsData } = useQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: () => productsApi.getProducts({ page: 1 }),
  })
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getWarehouses,
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(stockMutationSchema),
    defaultValues: { product: 0, warehouse: 0, quantity: 1, notes: "" },
  })

  const mutationFn = mode === "IN" ? productsApi.stockIn : productsApi.stockOut

  const mutation = useMutation({
    mutationFn: ({ product, warehouse, quantity, notes }: z.infer<typeof stockMutationSchema>) =>
      mutationFn(product, { quantity, warehouse, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      onClose()
    },
  })

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  const products = productsData?.results ?? []
  const warehouses = warehousesData?.results ?? []

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mutation.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {(mutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Something went wrong. Please try again."}
        </div>
      )}

      <Field label="Product" error={errors.product?.message}>
        <SelectInput hasError={!!errors.product} {...register("product")}>
          <option value={0}>Select a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity})</option>
          ))}
        </SelectInput>
      </Field>

      <Field label="Warehouse" error={errors.warehouse?.message}>
        <SelectInput hasError={!!errors.warehouse} {...register("warehouse")}>
          <option value={0}>Select a warehouse</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </SelectInput>
      </Field>

      <Field label="Quantity" error={errors.quantity?.message}>
        <Input type="number" min={1} placeholder="1" hasError={!!errors.quantity} {...register("quantity")} />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea placeholder="Optional — reason for this movement" hasError={!!errors.notes} {...register("notes")} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className={[
            "rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50",
            mode === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600",
          ].join(" ")}
        >
          {mutation.isPending ? "Processing…" : mode === "IN" ? "Add stock" : "Remove stock"}
        </button>
      </div>
    </form>
  )
}

// ─── Adjust Stock form (admin only) ──────────────────────────────────────────

const adjustSchema = z.object({
  product: z.coerce.number().min(1, "Select a product"),
  warehouse: z.coerce.number().min(1, "Select a warehouse"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  reason: z.string().optional(),
})

function AdjustStockForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()

  const { data: productsData } = useQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: () => productsApi.getProducts({ page: 1 }),
  })
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getWarehouses,
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(adjustSchema),
    defaultValues: { product: 0, warehouse: 0, quantity: 0, reason: "" },
  })

  const mutation = useMutation({
    mutationFn: ({ product, warehouse, quantity, reason }: z.infer<typeof adjustSchema>) =>
      productsApi.adjustStock(product, { quantity, warehouse, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      onClose()
    },
  })

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  const products = productsData?.results ?? []
  const warehouses = warehousesData?.results ?? []

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mutation.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {(mutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Something went wrong. Please try again."}
        </div>
      )}

      <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Adjust sets the stock to the exact quantity you enter, regardless of current levels. Use for inventory audits only.
      </div>

      <Field label="Product" error={errors.product?.message}>
        <SelectInput hasError={!!errors.product} {...register("product")}>
          <option value={0}>Select a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (current: {p.quantity})</option>
          ))}
        </SelectInput>
      </Field>

      <Field label="Warehouse" error={errors.warehouse?.message}>
        <SelectInput hasError={!!errors.warehouse} {...register("warehouse")}>
          <option value={0}>Select a warehouse</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </SelectInput>
      </Field>

      <Field label="New quantity (absolute)" error={errors.quantity?.message}>
        <Input type="number" min={0} placeholder="0" hasError={!!errors.quantity} {...register("quantity")} />
      </Field>

      <Field label="Reason" error={errors.reason?.message}>
        <Textarea placeholder="e.g. Inventory audit correction" hasError={!!errors.reason} {...register("reason")} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? "Adjusting…" : "Set quantity"}
        </button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ModalMode = "IN" | "OUT" | "ADJ" | null

export default function StockPage() {
  const { isAdmin } = useAuth()
  const [page, setPage] = useState(1)
  const [filterProduct, setFilterProduct] = useState("")
  const [filterWarehouse, setFilterWarehouse] = useState("")
  const [filterType, setFilterType] = useState("")
  const [modal, setModal] = useState<ModalMode>(null)

  const { data: txData, isLoading } = useQuery({
    queryKey: ["transactions", { page, filterProduct, filterWarehouse, filterType }],
    queryFn: () =>
      productsApi.getTransactions({
        page,
        product: filterProduct ? Number(filterProduct) : undefined,
        warehouse: filterWarehouse ? Number(filterWarehouse) : undefined,
        transaction_type: filterType || undefined,
      }),
  })

  const { data: productsData } = useQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: () => productsApi.getProducts({ page: 1 }),
  })
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getWarehouses,
  })

  const transactions = txData?.results ?? []
  const totalPages = txData ? Math.ceil(txData.count / 50) : 1

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stock Transactions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {txData?.count ?? 0} transactions recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal("IN")}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Stock In
          </button>
          <button
            onClick={() => setModal("OUT")}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            Stock Out
          </button>
          {isAdmin && (
            <button
              onClick={() => setModal("ADJ")}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Adjust
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterProduct}
          onChange={(e) => { setFilterProduct(e.target.value); setPage(1) }}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
        >
          <option value="">All products</option>
          {(productsData?.results ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterWarehouse}
          onChange={(e) => { setFilterWarehouse(e.target.value); setPage(1) }}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
        >
          <option value="">All warehouses</option>
          {(warehousesData?.results ?? []).map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
        >
          <option value="">All types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="ADJ">Adjustment</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Warehouse</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Performed by</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[12, 32, 28, 12, 24, 36, 24].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className={`h-4 w-${w} animate-pulse rounded bg-muted`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowDownUp className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
                    <p className="text-xs text-muted-foreground">Use Stock In or Stock Out to record a movement</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <TxBadge type={tx.transaction_type} />
                  </td>
                  <td className="px-4 py-3 font-medium">{tx.product_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.warehouse_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{tx.quantity}</td>
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
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
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
              Page {page} of {totalPages} · {txData?.count} total
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "IN" && (
        <Modal title="Stock In" onClose={() => setModal(null)}>
          <StockMutationForm mode="IN" onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === "OUT" && (
        <Modal title="Stock Out" onClose={() => setModal(null)}>
          <StockMutationForm mode="OUT" onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === "ADJ" && isAdmin && (
        <Modal title="Adjust Stock" onClose={() => setModal(null)}>
          <AdjustStockForm onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}