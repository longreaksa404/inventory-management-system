import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Users, Power, ShieldAlert } from "lucide-react"
import { userManagementApi } from "@/api/userManagement"
import { useAuth } from "@/hooks/useAuth"
import type { User, UserRole } from "@/types"

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-purple-50 text-purple-700",
  manager: "bg-blue-50 text-blue-700",
  staff: "bg-zinc-100 text-zinc-600",
  customer: "bg-teal-50 text-teal-700",
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  )
}

// ─── Role select (inline edit) ────────────────────────────────────────────────

function RoleSelect({
  user,
  disabled,
  onChange,
}: {
  user: User
  disabled: boolean
  onChange: (role: UserRole) => void
}) {
  return (
    <select
      value={user.role}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors disabled:opacity-50"
    >
      <option value="admin">Admin</option>
      <option value="manager">Manager</option>
      <option value="staff">Staff</option>
      <option value="customer">Customer</option>
    </select>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [roleFilter, setRoleFilter] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => userManagementApi.getAllUsers(),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: { role?: UserRole; is_active?: boolean }
    }) => userManagementApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] })
    },
  })

  const allUsers = data?.results ?? []
  const users = roleFilter ? allUsers.filter((u) => u.role === roleFilter) : allUsers

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {data?.count ?? 0} accounts · change role or active status
        </p>
      </div>

      {/* Filter */}
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
      >
        <option value="">All roles</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="staff">Staff</option>
        <option value="customer">Customer</option>
      </select>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {[28, 32, 16, 16, 20].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className={`h-4 w-${w} animate-pulse rounded bg-muted`} />
                    </td>
                  ))}
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No users found</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {u.first_name} {u.last_name}
                      {isSelf && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <RoleBadge role={u.role} />
                      ) : (
                        <RoleSelect
                          user={u}
                          disabled={updateMutation.isPending}
                          onChange={(role) =>
                            updateMutation.mutate({ id: u.id, payload: { role } })
                          }
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          u.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-zinc-100 text-zinc-500",
                        ].join(" ")}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                      {new Date(u.date_joined).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isSelf ? (
                          <span
                            title="You cannot modify your own account here"
                            className="text-muted-foreground/40"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: u.id,
                                payload: { is_active: !u.is_active },
                              })
                            }
                            disabled={updateMutation.isPending}
                            title={u.is_active ? "Deactivate" : "Reactivate"}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40 transition-colors"
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}