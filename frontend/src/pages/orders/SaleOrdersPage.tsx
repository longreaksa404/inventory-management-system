// src/pages/orders/SaleOrdersPage.tsx
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
  Receipt,
  Trash2,
  CheckCircle,
  Truck,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { ordersApi } from "@/api/orders"
import { productsApi } from "@/api/products"
import { warehousesApi } from "@/api/warehouses"
import type { SaleOrder, OrderStatus } from "@/types"

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-zinc-100 text-zinc-600" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700" },
  shipped:   { label: "Shipped",   className: "bg-indigo-50 text-indigo-700" },
  received:  { label: "Received",  className: "bg-teal-50 text-teal-700" },
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
  title, message, confirmLabel, confirmClass,
  onConfirm, onCancel, isLoading,
}: {
  title: string; message: string; confirmLabel: string; confirmClass: string;
  onConfirm: () => void; onCancel: () => void; isLoading: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors">Cancel</button>
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

// ─── Create SO form ───────────────────────────────────────────────────────────

const itemSchema = z.object({
  product: z.coerce.number().min(1, "Select a product"),
  quantity: z.coerce.number().min(1, "Min 1"),
  unit_price: z.string().min(1, "Required"),
  discount: z.string().optional(),
  notes: z.string().optional(),
})

const createSOSchema = z.object({
  customer: z.coerce.number().min(1, "Customer ID is required"),
  warehouse: z.coerce.number().min(1, "Select a warehouse"),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
})

function CreateSOForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getWarehouses,
  })
  const { data: productsData } = useQuery({
    queryKey: ["products", { page: 1 }],
    queryFn: () => productsApi.getProducts({ page: 1 }),
  })

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(createSOSchema),
    defaultValues: {
      customer: 0,
      warehouse: 0,
      notes: "",
      items: [{ product: 0, quantity: 1, unit_price: "", discount: "0", notes: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const mutation = useMutation({
    mutationFn: ordersApi.createSaleOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-orders"] })
      onClose()
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      customer: values.customer,
      warehouse: values.warehouse,
      notes: values.notes,
      items: values.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || "0",
        notes: item.notes,
      })),
    })
  })

  const warehouses = warehousesData?.results ?? []
  const products = productsData?.results ?? []

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mutation.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {(mutation.error as { response?: { data?: { detail?: string; items?: string[] } } })?.response?.data?.detail
            ?? (mutation.error as { response?: { data?: { items?: string[] } } })?.response?.data?.items?.join(", ")
            ?? "Something went wrong. Please check stock levels and try again."}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer ID" error={errors.customer?.message}>
          <Input
            type="number"
            min={1}
            placeholder="Enter customer user ID"
            hasError={!!errors.customer}
            {...register("customer")}
          />
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

      <Field label="Notes" error={errors.notes?.message}>
        <Input placeholder="Optional order notes" hasError={!!errors.notes} {...register("notes")} />
      </Field>

      {/* Items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Order items</span>
          <button
            type="button"
            onClick={() => append({ product: 0, quantity: 1, unit_price: "", discount: "0", notes: "" })}
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
                    <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>
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
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  hasError={!!errors.items?.[index]?.unit_price}
                  {...register(`items.${index}.unit_price`)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Discount"
                  {...register(`items.${index}.discount`)}
                />
              </div>
              <div className="col-span-1 flex justify-end pt-0.5">
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

// ─── Order row (expandable) ───────────────────────────────────────────────────

function SaleOrderRow({
  order,
  onConfirm,
  onShip,
  onInvoice,
}: {
  order: SaleOrder
  onConfirm: (id: number) => void
  onShip: (id: number) => void
  onInvoice: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const lineTotal = order.items_detail.reduce((sum, item) => sum + Number(item.line_total), 0)

  return (
    <>
      <tr
        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id}</td>
        <td className="px-4 py-3 font-medium">{order.customer_name}</td>
        <td className="px-4 py-3 text-muted-foreground">{order.warehouse_name}</td>
        <td className="px-4 py-3">
          <StatusBadge status={order.status} />
        </td>
        <td className="px-4 py-3 text-right tabular-nums">${lineTotal.toFixed(2)}</td>
        <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
          {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
                onClick={() => onShip(order.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Truck className="h-3.5 w-3.5" /> Ship
              </button>
            )}
            {order.status === "shipped" && (
              <button
                onClick={() => onInvoice(order.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" /> Invoice
              </button>
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
                    {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                    {Number(item.discount) > 0 && ` − $${Number(item.discount).toFixed(2)}`}
                    {" = "}${Number(item.line_total).toFixed(2)}
                  </span>
                </div>
              ))}
              {order.notes && (
                <p className="mt-2 text-muted-foreground">Notes: {order.notes}</p>
              )}
              {order.shipped_date && (
                <p className="mt-1 text-muted-foreground">
                  Shipped: {new Date(order.shipped_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SaleOrdersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [shipId, setShipId] = useState<number | null>(null)
  const [invoiceId, setInvoiceId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["sale-orders", { page, status: statusFilter }],
    queryFn: () => ordersApi.getSaleOrders({ page, status: statusFilter || undefined }),
  })

  const confirmMutation = useMutation({
    mutationFn: ordersApi.confirmSaleOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sale-orders"] }); setConfirmId(null) },
  })

  const shipMutation = useMutation({
    mutationFn: ordersApi.shipSaleOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sale-orders"] }); setShipId(null) },
  })

  const invoiceMutation = useMutation({
    mutationFn: ordersApi.invoiceSaleOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sale-orders"] }); setInvoiceId(null) },
  })

  const orders = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / 50) : 1

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sale Orders</h1>
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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</th>
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
                    <Receipt className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No sale orders yet</p>
                    <p className="text-xs text-muted-foreground">Create an order to start fulfilling sales</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <SaleOrderRow
                  key={order.id}
                  order={order}
                  onConfirm={setConfirmId}
                  onShip={setShipId}
                  onInvoice={setInvoiceId}
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
        <Modal title="New sale order" onClose={() => setShowCreate(false)}>
          <CreateSOForm onClose={() => setShowCreate(false)} />
        </Modal>
      )}
      {confirmId !== null && (
        <ConfirmDialog
          title="Confirm order"
          message="Mark this sale order as confirmed? Stock will not be deducted yet — that happens when you ship."
          confirmLabel="Confirm order"
          confirmClass="bg-blue-600 hover:bg-blue-700"
          onConfirm={() => confirmMutation.mutate(confirmId)}
          onCancel={() => setConfirmId(null)}
          isLoading={confirmMutation.isPending}
        />
      )}
      {shipId !== null && (
        <ConfirmDialog
          title="Ship order"
          message="Ship this order? Stock will be deducted from inventory immediately. This action cannot be undone."
          confirmLabel="Ship and deduct stock"
          confirmClass="bg-indigo-600 hover:bg-indigo-700"
          onConfirm={() => shipMutation.mutate(shipId)}
          onCancel={() => setShipId(null)}
          isLoading={shipMutation.isPending}
        />
      )}
      {invoiceId !== null && (
        <ConfirmDialog
          title="Invoice order"
          message="Mark this order as invoiced? The customer will be billed for this shipment."
          confirmLabel="Mark as invoiced"
          confirmClass="bg-purple-600 hover:bg-purple-700"
          onConfirm={() => invoiceMutation.mutate(invoiceId)}
          onCancel={() => setInvoiceId(null)}
          isLoading={invoiceMutation.isPending}
        />
      )}
    </div>
  )
}