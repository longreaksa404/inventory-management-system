// src/pages/customers/CustomersPage.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, X, Users, Search, Power } from "lucide-react"
import { customersApi } from "@/api/customers"
import type { Customer } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(150),
  last_name: z.string().min(1, "Last name is required").max(150),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Enter a valid email",
    }),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+855\d{8,9}$/, "Phone must be in +855xxxxxxxx format"),
})

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

// ─── Customer form (create / edit) ─────────────────────────────────────────────

export function CustomerForm({
  editing,
  onClose,
  onCreated,
}: {
  editing: Customer | null
  onClose: () => void
  onCreated?: (customer: Customer) => void
}) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: editing
      ? {
          first_name: editing.first_name,
          last_name: editing.last_name,
          email: editing.email,
          phone_number: editing.phone_number,
        }
      : { first_name: "", last_name: "", email: "", phone_number: "" },
  })

  const createMutation = useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["users", { role: "customer" }] })
      onCreated?.(customer)
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof customerSchema> }) =>
      customersApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["users", { role: "customer" }] })
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
          Something went wrong. Check the email isn't already in use.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors.first_name?.message}>
          <Input placeholder="e.g. John" hasError={!!errors.first_name} autoFocus {...register("first_name")} />
        </Field>
        <Field label="Last name" error={errors.last_name?.message}>
          <Input placeholder="e.g. Doe" hasError={!!errors.last_name} {...register("last_name")} />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <Input type="email" placeholder="e.g. john@example.com" hasError={!!errors.email} {...register("email")} />
      </Field>

      <Field label="Phone" error={errors.phone_number?.message}>
        <Input placeholder="e.g. +85512345678" hasError={!!errors.phone_number} {...register("phone_number")} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? (editing ? "Saving…" : "Creating…") : editing ? "Save changes" : "Create customer"}
        </button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  let searchTimeout = 0
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(() => setDebouncedSearch(e.target.value), 400)
  }

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { search: debouncedSearch }],
    queryFn: () => customersApi.getCustomers({ search: debouncedSearch || undefined }),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      customersApi.updateCustomer(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  })

  const customers = data?.results ?? []

  const openCreate = () => { setEditing(null); setShowForm(true) }
  const openEdit = (c: Customer) => { setEditing(c); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{data?.count ?? 0} customers</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add customer
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name, email, or phone…"
          className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[28, 32, 24, 16].map((w, j) => (
                    <td key={j} className="px-4 py-3"><div className={`h-4 w-${w} animate-pulse rounded bg-muted`} /></td>
                  ))}
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {debouncedSearch ? "No customers match your search" : "No customers yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {debouncedSearch ? "Try a different name, email, or phone" : "Add a customer to start creating sale orders"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.email || <span className="italic text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {c.phone_number || <span className="italic text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      c.is_active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500",
                    ].join(" ")}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: c.id, is_active: !c.is_active })}
                        title={c.is_active ? "Deactivate" : "Reactivate"}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? `Edit — ${editing.first_name} ${editing.last_name}` : "Add customer"} onClose={closeForm}>
          <CustomerForm editing={editing} onClose={closeForm} />
        </Modal>
      )}
    </div>
  )
}