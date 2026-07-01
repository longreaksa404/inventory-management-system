// src/api/userManagement.ts
import { apiClient } from "./client"
import type { User, UserRole } from "@/types"

export interface UserManagementPayload {
  role?: UserRole
  is_active?: boolean
}

export const userManagementApi = {
  // Reuses the existing ?role= filtered list endpoint to fetch everyone —
  // admin (full unfiltered list) is enforced server-side in AccountsView
  // when no ?role= param is passed.
  getAllUsers: async (params?: {
    page?: number
  }): Promise<{ count: number; results: User[] }> => {
    const { data } = await apiClient.get<{ count: number; next: string | null; previous: string | null; results: User[] }>(
      "/accounts/",
      { params }
    )
    return data
  },

  getUser: async (id: number): Promise<User> => {
    const { data } = await apiClient.get<User>(`/accounts/${id}/`)
    return data
  },

  updateUser: async (
    id: number,
    payload: UserManagementPayload
  ): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/accounts/${id}/`, payload)
    return data
  },
}