// src/pages/orders/PurchaseOrdersPage.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Trash2,
  CheckCircle,
  PackageCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { ordersApi } from "@/api/orders"
import { productsApi } from "@/api/products"
import { suppliersApi } from "@/api/suppliers"
import { warehousesApi } from "@/api/warehouses"
import type { PurchaseOrder, OrderStatus } from "@/types"
import { useOrderStatusPolling } from "@/hooks/useOrderStatusPolling"

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-zinc-100 text-zinc-600" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700" },
  shipped:   { label: "Shipped",   className: "bg-indigo-50 text-indigo-700" },
  received:  { label: "Received",  className: "bg-green-50 text-green-700" },
  invoiced:  { label: "Invoiced",  className: "bg-purple-50 text-purple-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-500" },
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
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

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-card shadow-xl mx-4 max-h-[92vh] overflow-y-auto">
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

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  isLoading,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 transition-colors ${confirmClass}`}
        >
          {isLoading ? "Processing…" : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ─── Create PO form ───────────────────────────────────────────────────────────

const itemSchema = z.object({
  product: z.coerce.number().min(1, "Select a product"),
  quantity: z.coerce.number().min(1, "Min 1"),
  unit_price: z.string().min(1, "Required"),
  notes: z.string().optional(),
})

const createPOSchema = z.object({
  supplier: z.coerce.number().min(1, "Select a supplier"),
  warehouse: z.coerce.number().min(1, "Select a warehouse"),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
})

function CreatePOForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", {}],
    queryFn: () => suppliersApi.getSuppliers(),
  })
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getWarehouses,
  })
  const { data: productsData } = useQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: () => productsApi.getProducts({ page: 1 }),
  })

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(createPOSchema),
    defaultValues: {
      supplier: 0,
      warehouse: 0,
      expected_date: "",
      notes: "",
      items: [{ product: 0, quantity: 1, unit_price: "", notes: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const mutation = useMutation({
    mutationFn: ordersApi.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      onClose()
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      supplier: values.supplier,
      warehouse: values.warehouse,
      expected_date: values.expected_date || undefined,
      notes: values.notes,
      items: values.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes,
      })),
    })
  })

  const suppliers = suppliersData?.results ?? []
  const warehouses = warehousesData?.results ?? []
  const products = productsData?.results ?? []

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mutation.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Supplier" error={errors.supplier?.message}>
          <SelectInput hasError={!!errors.supplier} {...register("supplier")}>
            <option value={0}>Select a supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected delivery date" error={errors.expected_date?.message}>
          <Input type="date" hasError={!!errors.expected_date} {...register("expected_date")} />
        </Field>
        <Field label="Notes" error={errors.notes?.message}>
          <Input placeholder="Optional" hasError={!!errors.notes} {...register("notes")} />
        </Field>
      </div>

      {/* Items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Order items</span>
          <button
            type="button"
            onClick={() => append({ product: 0, quantity: 1, unit_price: "", notes: "" })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> Add item
          </button>
        </div>
        {errors.items?.root && (
          <p className="mb-2 text-xs text-red-500">{errors.items.root.message}</p>
        )}
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-5">
                <SelectInput
                  hasError={!!errors.items?.[index]?.product}
                  {...register(`items.${index}.product`)}
                >
                  <option value={0}>Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </SelectInput>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  hasError={!!errors.items?.[index]?.quantity}
                  {...register(`items.${index}.quantity`)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Unit price"
                  hasError={!!errors.items?.[index]?.unit_price}
                  {...register(`items.${index}.unit_price`)}
                />
              </div>
              <div className="col-span-2 flex justify-end pt-0.5">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {mutation.isPending ? "Creating…" : "Create order"}
        </button>
      </div>
    </form>
  )
}

// ─── Order detail row (expandable) ───────────────────────────────────────────

function OrderRow({
  order,
  onConfirm,
  onReceive,
  isPolling,
}: {
  order: PurchaseOrder
  onConfirm: (id: number) => void
  onReceive: (id: number) => void
  isPolling: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const lineTotal = order.items_detail.reduce(
    (sum, item) => sum + Number(item.line_total),
    0
  )

  return (
    <>
      <tr
        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id}</td>
        <td className="px-4 py-3 font-medium">{order.supplier_name}</td>
        <td className="px-4 py-3 text-muted-foreground">{order.warehouse_name}</td>
        <td className="px-4 py-3">
          <StatusBadge status={order.status} />
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          ${lineTotal.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
          {order.expected_date
            ? new Date(order.expected_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : <span className="italic text-muted-foreground/50">—</span>
          }
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {isPolling ? (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-foreground" />
                Processing…
              </span>
            ) : (
              <>
                {order.status === "draft" && (
                  <button
                    onClick={() => onConfirm(order.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Confirm
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button
                    onClick={() => onReceive(order.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <PackageCheck className="h-3.5 w-3.5" /> Receive
                  </button>
                )}
              </>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/10">
          <td colSpan={7} className="px-6 py-3">
            <div className="text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-2">Items</p>
              {order.items_detail.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-foreground">{item.product_name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {item.quantity} × ${Number(item.unit_price).toFixed(2)} = ${Number(item.line_total).toFixed(2)}
                  </span>
                </div>
              ))}
              {order.notes && (
                <p className="mt-2 text-muted-foreground">Notes: {order.notes}</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [receiveId, setReceiveId] = useState<number | null>(null)

  const { pollingIds, startPolling } = useOrderStatusPolling(
    ordersApi.getPurchaseOrder,
    ["purchase-orders"]
  )

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-orders", { page, status: statusFilter }],
    queryFn: () => ordersApi.getPurchaseOrders({ page, status: statusFilter || undefined }),
  })

  const confirmMutation = useMutation({
    mutationFn: ordersApi.confirmPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      setConfirmId(null)
    },
  })

  const receiveMutation = useMutation({
    mutationFn: ordersApi.receivePurchaseOrder,
    onSuccess: (_data, id) => {
      setReceiveId(null)
      // 202 Accepted — Celery hasn't finished yet. Poll until the order
      // leaves "confirmed" (or 15s elapses), then refresh the list.
      startPolling(id, "confirmed")
    },
  })

  const orders = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 50) : 1

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Purchase Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{data?.count ?? 0} orders</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> New order
        </button>
      </div>

      {/* Filter */}
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
      >
        <option value="">All statuses</option>
        {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Supplier</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Expected</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[12, 28, 24, 16, 16, 20].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className={`h-4 w-${w} animate-pulse rounded bg-muted`} />
                    </td>
                  ))}
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No purchase orders yet</p>
                    <p className="text-xs text-muted-foreground">Create an order to start receiving stock</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onConfirm={setConfirmId}
                  onReceive={setReceiveId}
                  isPolling={pollingIds.has(order.id)}
                />
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <Modal title="New purchase order" onClose={() => setShowCreate(false)}>
          <CreatePOForm onClose={() => setShowCreate(false)} />
        </Modal>
      )}

      {confirmId !== null && (
        <ConfirmDialog
          title="Confirm order"
          message="Mark this purchase order as confirmed? Stock will not change yet — stock updates when you receive the order."
          confirmLabel="Confirm order"
          confirmClass="bg-blue-600 hover:bg-blue-700"
          onConfirm={() => confirmMutation.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
          isLoading={confirmMutation.isPending}
        />
      )}

      {receiveId !== null && (
        <ConfirmDialog
          title="Receive order"
          message="Mark this order as received? This will add all item quantities to your inventory. This action cannot be undone."
          confirmLabel="Receive and update stock"
          confirmClass="bg-green-600 hover:bg-green-700"
          onConfirm={() => receiveMutation.mutate(receiveId)}
          onCancel={() => setReceiveId(null)}
          isLoading={receiveMutation.isPending}
        />
      )}
    </div>
  )
}