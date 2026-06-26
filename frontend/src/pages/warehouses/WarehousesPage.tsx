// src/pages/warehouses/WarehousesPage.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, X, Warehouse } from "lucide-react"
import { warehousesApi } from "@/api/warehouses"
import type { Warehouse as WarehouseType } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(10, "Code must be 10 characters or fewer")
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and numbers only"),
  location: z.string().max(255).optional(),
  contact_person: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Enter a valid email").min(1, "Email is required"),
  notes: z.string().optional(),
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
  warehouse,
  onConfirm,
  onCancel,
  isLoading,
}: {
  warehouse: WarehouseType
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <Modal title="Delete warehouse" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-medium text-foreground">{warehouse.name}</span>?
        Orders and stock transactions linked to this warehouse will be affected.
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

// ─── Warehouse form ───────────────────────────────────────────────────────────

function WarehouseForm({
  editing,
  onClose,
}: {
  editing: WarehouseType | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          code: editing.code,
          location: editing.location ?? "",
          contact_person: editing.contact_person ?? "",
          phone: editing.phone ?? "",
          email: editing.email,
          notes: editing.notes ?? "",
        }
      : {
          name: "",
          code: "",
          location: "",
          contact_person: "",
          phone: "",
          email: "",
          notes: "",
        },
  })

  const createMutation = useMutation({
    mutationFn: warehousesApi.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: z.infer<typeof warehouseSchema>
    }) => warehousesApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
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
        <Field label="Warehouse name" error={errors.name?.message}>
          <Input
            placeholder="e.g. Main Warehouse"
            hasError={!!errors.name}
            autoFocus
            {...register("name")}
          />
        </Field>
        <Field label="Code" error={errors.code?.message}>
          <Input
            placeholder="e.g. WH001"
            hasError={!!errors.code}
            style={{ textTransform: "uppercase" }}
            {...register("code", {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase()
              },
            })}
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <Input
          type="email"
          placeholder="e.g. main@warehouse.com"
          hasError={!!errors.email}
          {...register("email")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Location" error={errors.location?.message}>
          <Input
            placeholder="e.g. Phnom Penh"
            hasError={!!errors.location}
            {...register("location")}
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

      <Field label="Contact person" error={errors.contact_person?.message}>
        <Input
          placeholder="e.g. John Doe"
          hasError={!!errors.contact_person}
          {...register("contact_person")}
        />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          placeholder="Optional — any relevant details about this warehouse"
          hasError={!!errors.notes}
          {...register("notes")}
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
            : "Create warehouse"}
        </button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WarehousesPage() {
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<WarehouseType | null>(null)
  const [deleting, setDeleting] = useState<WarehouseType | null>(null)

  const { data: warehousesData, isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getWarehouses,
  })

  const deleteMutation = useMutation({
    mutationFn: warehousesApi.deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      setDeleting(null)
    },
  })

  const warehouses = warehousesData?.results ?? []

  const openCreate = () => {
    setEditing(null)
    setShowForm(true)
  }
  const openEdit = (w: WarehouseType) => {
    setEditing(w)
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
          <h1 className="text-xl font-semibold">Warehouses</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {warehousesData?.count ?? 0} warehouse{(warehousesData?.count ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add warehouse
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[28, 14, 24, 24, 32].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className={`h-4 w-${w} animate-pulse rounded bg-muted`}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Warehouse className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No warehouses yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add a warehouse to start tracking stock locations
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              warehouses.map((warehouse) => (
                <tr
                  key={warehouse.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{warehouse.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {warehouse.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {warehouse.location || (
                      <span className="italic text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {warehouse.contact_person || (
                      <span className="italic text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {warehouse.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(warehouse)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(warehouse)}
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
          title={editing ? `Edit — ${editing.name}` : "Add warehouse"}
          onClose={closeForm}
        >
          <WarehouseForm editing={editing} onClose={closeForm} />
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <DeleteDialog
          warehouse={deleting}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}