// src/hooks/useAuth.ts
//
// The single hook components use for anything auth-related.
// Keeps component code clean — they import one thing, not the store directly.
//
// Interview talking point: this indirection means if we ever swap the auth
// implementation (e.g. from Context to Zustand, or add MFA), zero component
// files need to change — only this hook does.

import { useAuthContext } from "@/stores/authStore"
import type { UserRole } from "@/types"

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthContext()

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,

    // Convenience helpers used in role-based UI rendering.
    // Keeps role string comparisons out of JSX.
    isAdmin: user?.role === "admin",
    isManager: user?.role === "manager" || user?.role === "admin",
    isStaff: user?.role === "staff",
    isCustomer: user?.role === "customer",

    // Generic role check for components that need fine-grained control.
    hasRole: (role: UserRole) => user?.role === role,

    // Full display name — falls back gracefully.
    displayName: user
      ? `${user.first_name} ${user.last_name}`.trim() || user.username
      : "",
  }
}