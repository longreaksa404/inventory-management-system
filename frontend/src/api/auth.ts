// src/api/auth.ts
import { apiClient } from "./client"
import type {
  LoginCredentials,
  TokenPair,
  User,
  ChangePasswordPayload,
  PaginatedResponse,
  UserRole,
} from "@/types"

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<TokenPair> => {
    const { data } = await apiClient.post<TokenPair>(
      "/accounts/login/",
      credentials
    )
    return data
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/accounts/profile/")
    return data
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.put("/accounts/change-password/", payload)
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const { data } = await apiClient.post<{ access: string }>(
      "/accounts/refresh/",
      { refresh }
    )
    return data
  },

  // ─── User listing ──────────────────────────────────────────────────────────
  // Used by the Sale Order form to populate the customer dropdown.
  // Backend restricts the *unfiltered* list to admins, but ?role= is open
  // to any authenticated user — see apps/accounts/views.py AccountsView.
  getUsersByRole: async (
    role: UserRole
  ): Promise<PaginatedResponse<User>> => {
    const { data } = await apiClient.get<PaginatedResponse<User>>(
      "/accounts/",
      { params: { role } }
    )
    return data
  },
}