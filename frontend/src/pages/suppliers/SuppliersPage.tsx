// src/pages/suppliers/SuppliersPage.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, X, Truck, Search } from "lucide-react"
import { suppliersApi } from "@/api/suppliers"
import type { Supplier } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  contact_name: z
    .string()
    .min(1, "Contact name is required")
    .max(255, "Contact name must be 255 characters or fewer"),
  email: z
    .string()
    .max(254)
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Enter a valid email",
    }),
  phone: z.string().min(1, "Phone is required").max(20, "Phone must be 20 characters or fewer"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(255, "Address must be 255 characters or fewer"),
})

// ─── Shared form controls ─────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Input({
  hasError,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
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

function Textarea({
  hasError,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      rows={2}
      className={[
        "flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none",
        "placeholder:text-muted-foreground/50 transition-colors resize-none",
        "focus:border-ring focus:ring-2 focus:ring-ring/20",
        hasError ? "border-red-400" : "border-input",
      ].join(" ")}
      {...props}
    />
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
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
  supplier,
  onConfirm,
  onCancel,
  isLoading,
}: {
  supplier: Supplier
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <Modal title="Delete supplier" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-medium text-foreground">{supplier.name}</span>?
        Purchase orders linked to this supplier will be affected.
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

// ─── Supplier form ────────────────────────────────────────────────────────────

function SupplierForm({
  editing,
  onClose,
}: {
  editing: Supplier | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          contact_name: editing.contact_name,
          email: editing.email ?? "",
          phone: editing.phone,
          address: editing.address,
        }
      : {
          name: "",
          contact_name: "",
          email: "",
          phone: "",
          address: "",
        },
  })

  const createMutation = useMutation({
    mutationFn: suppliersApi.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: z.infer<typeof supplierSchema>
    }) => suppliersApi.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      onClose()
    },
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
        <Field label="Supplier name" error={errors.name?.message}>
          <Input
            placeholder="e.g. Tech Supplies Co."
            hasError={!!errors.name}
            autoFocus
            {...register("name")}
          />
        </Field>
        <Field label="Contact person" error={errors.contact_name?.message}>
          <Input
            placeholder="e.g. Jane Smith"
            hasError={!!errors.contact_name}
            {...register("contact_name")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="e.g. contact@supplier.com"
            hasError={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input
            placeholder="e.g. +85512345678"
            hasError={!!errors.phone}
            {...register("phone")}
          />
        </Field>
      </div>

      <Field label="Address" error={errors.address?.message}>
        <Textarea
          placeholder="e.g. 123 Main St, Phnom Penh"
          hasError={!!errors.address}
          {...register("address")}
        />
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
            ? editing
              ? "Saving…"
              : "Creating…"
            : editing
            ? "Save changes"
            : "Create supplier"}
        </button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)

  let searchTimeout = 0

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(() => {
      setDebouncedSearch(e.target.value)
    }, 400)
  }

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ["suppliers", { search: debouncedSearch }],
    queryFn: () =>
      suppliersApi.getSuppliers({
        search: debouncedSearch || undefined,
        ordering: "name",
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      setDeleting(null)
    },
  })

  const suppliers = suppliersData?.results ?? []

  const openCreate = () => {
    setEditing(null)
    setShowForm(true)
  }
  const openEdit = (s: Supplier) => {
    setEditing(s)
    setShowForm(true)
  }
  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Suppliers</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {suppliersData?.count ?? 0} supplier{(suppliersData?.count ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add supplier
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or contact…"
          className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Address
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[28, 24, 32, 24, 36].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className={`h-4 w-${w} animate-pulse rounded bg-muted`}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {debouncedSearch ? "No suppliers match your search" : "No suppliers yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {debouncedSearch
                        ? "Try a different name or contact"
                        : "Add a supplier to start creating purchase orders"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{supplier.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.contact_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.email || (
                      <span className="italic text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {supplier.phone}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="line-clamp-1">{supplier.address}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(supplier)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(supplier)}
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
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <Modal
          title={editing ? `Edit — ${editing.name}` : "Add supplier"}
          onClose={closeForm}
        >
          <SupplierForm editing={editing} onClose={closeForm} />
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <DeleteDialog
          supplier={deleting}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}