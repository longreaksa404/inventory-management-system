// src/pages/products/ProductsPage.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Search, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { productsApi } from "@/api/products"
import type { Product, Category } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.coerce.number().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  reorder_level: z.coerce.number().min(1, "Reorder level must be at least 1"),
  status: z.enum(["active", "discontinued", "out_of_stock"]),
})

// ─── Stock badge ──────────────────────────────────────────────────────────────

function StockBadge({ quantity, reorderLevel }: { quantity: number; reorderLevel: number }) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
        Out of stock
      </span>
    )
  }
  if (quantity <= reorderLevel) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
        Low — {quantity}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
      {quantity}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Product["status"] }) {
  const map = {
    active: "bg-green-50 text-green-700",
    discontinued: "bg-zinc-100 text-zinc-500",
    out_of_stock: "bg-red-50 text-red-600",
  }
  const label = {
    active: "Active",
    discontinued: "Discontinued",
    out_of_stock: "Out of stock",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {label[status]}
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
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl mx-4">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  product,
  onConfirm,
  onCancel,
  isLoading,
}: {
  product: Product
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <Modal title="Delete product" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-medium text-foreground">{product.name}</span>?
        This cannot be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  )
}

// ─── Product form ─────────────────────────────────────────────────────────────

function ProductForm({
  editing,
  categories,
  onClose,
}: {
  editing: Product | null
  categories: Category[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          sku: editing.sku,
          category: editing.category,
          price: editing.price,
          quantity: editing.quantity,
          reorder_level: editing.reorder_level,
          status: editing.status,
        }
      : {
          name: "",
          sku: "",
          category: 0,
          price: "",
          quantity: 0,
          reorder_level: 5,
          status: "active" as const,
        },
  })

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); onClose() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof productSchema> }) =>
      productsApi.updateProduct(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); onClose() },
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const serverError = createMutation.error || updateMutation.error

  const onSubmit = handleSubmit((values) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Product name" error={errors.name?.message}>
          <Input placeholder="e.g. Laptop Pro" hasError={!!errors.name} {...register("name")} />
        </Field>
        <Field label="SKU" error={errors.sku?.message}>
          <Input placeholder="e.g. LAP001" hasError={!!errors.sku} {...register("sku")} />
        </Field>
      </div>

      <Field label="Category" error={errors.category?.message}>
        <SelectInput hasError={!!errors.category} {...register("category")}>
          <option value={0}>Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectInput>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Price ($)" error={errors.price?.message}>
          <Input type="number" step="0.01" min="0" placeholder="0.00" hasError={!!errors.price} {...register("price")} />
        </Field>
        <Field label="Quantity" error={errors.quantity?.message}>
          <Input type="number" min="0" placeholder="0" hasError={!!errors.quantity} {...register("quantity")} />
        </Field>
        <Field label="Reorder level" error={errors.reorder_level?.message}>
          <Input type="number" min="1" placeholder="5" hasError={!!errors.reorder_level} {...register("reorder_level")} />
        </Field>
      </div>

      <Field label="Status" error={errors.status?.message}>
        <SelectInput hasError={!!errors.status} {...register("status")}>
          <option value="active">Active</option>
          <option value="discontinued">Discontinued</option>
          <option value="out_of_stock">Out of stock</option>
        </SelectInput>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending
            ? editing ? "Saving…" : "Creating…"
            : editing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  let searchTimeout = 0

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(() => {
      setDebouncedSearch(e.target.value)
      setPage(1)
    }, 400)
  }

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", { page, search: debouncedSearch, category: categoryFilter, status: statusFilter }],
    queryFn: () =>
      productsApi.getProducts({
        page,
        search: debouncedSearch || undefined,
        category: categoryFilter ? Number(categoryFilter) : undefined,
        status: statusFilter || undefined,
      }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.getCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setDeleting(null)
    },
  })

  const products = productsData?.results ?? []
  const categories = categoriesData?.results ?? []
  const totalPages = productsData ? Math.ceil(productsData.count / 50) : 1

  const openCreate = () => { setEditing(null); setShowForm(true) }
  const openEdit = (p: Product) => { setEditing(p); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {productsData?.count ?? 0} products in inventory
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or SKU…"
            className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="discontinued">Discontinued</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[32, 20, 24, 16, 16, 16].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className={`h-4 w-${w} animate-pulse rounded bg-muted`} />
                    </td>
                  ))}
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <p className="text-sm font-medium text-muted-foreground">No products found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {search || categoryFilter || statusFilter
                      ? "Try adjusting your filters"
                      : "Click 'Add product' to get started"}
                  </p>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">{product.category_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${Number(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <StockBadge quantity={product.quantity} reorderLevel={product.reorder_level} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(product)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(product)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {productsData?.count} total
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

      {/* Create / Edit modal */}
      {showForm && (
        <Modal title={editing ? `Edit — ${editing.name}` : "Add product"} onClose={closeForm}>
          <ProductForm editing={editing} categories={categories} onClose={closeForm} />
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <DeleteDialog
          product={deleting}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}