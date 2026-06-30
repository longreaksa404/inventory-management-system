// src/api/customers.ts
import { apiClient } from "./client"
import type { Customer, CustomerPayload, PaginatedResponse } from "@/types"

export const customersApi = {
  getCustomers: async (params?: {
    page?: number
    search?: string
  }): Promise<PaginatedResponse<Customer>> => {
    const { data } = await apiClient.get<PaginatedResponse<Customer>>(
      "/accounts/customers/",
      { params }
    )
    return data
  },

  getCustomer: async (id: number): Promise<Customer> => {
    const { data } = await apiClient.get<Customer>(`/accounts/customers/${id}/`)
    return data
  },

  createCustomer: async (payload: CustomerPayload): Promise<Customer> => {
    const { data } = await apiClient.post<Customer>("/accounts/customers/", payload)
    return data
  },

  updateCustomer: async (
    id: number,
    payload: Partial<CustomerPayload> & { is_active?: boolean }
  ): Promise<Customer> => {
    const { data } = await apiClient.patch<Customer>(
      `/accounts/customers/${id}/`,
      payload
    )
    return data
  },
}