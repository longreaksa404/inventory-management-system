// src/api/auth.ts
import { apiClient } from "./client"
import type {
  LoginCredentials,
  TokenPair,
  User,
  ChangePasswordPayload,
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
}