// src/api/suppliers.ts
import { apiClient } from "./client"
import type { Supplier, SupplierPayload, PaginatedResponse } from "@/types"

export const suppliersApi = {
  getSuppliers: async (params?: {
    page?: number
    search?: string
    ordering?: string
  }): Promise<PaginatedResponse<Supplier>> => {
    const { data } = await apiClient.get<PaginatedResponse<Supplier>>(
      "/suppliers/",
      { params }
    )
    return data
  },

  getSupplier: async (id: number): Promise<Supplier> => {
    const { data } = await apiClient.get<Supplier>(`/suppliers/${id}/`)
    return data
  },

  createSupplier: async (payload: SupplierPayload): Promise<Supplier> => {
    const { data } = await apiClient.post<Supplier>("/suppliers/", payload)
    return data
  },

  updateSupplier: async (
    id: number,
    payload: Partial<SupplierPayload>
  ): Promise<Supplier> => {
    const { data } = await apiClient.patch<Supplier>(
      `/suppliers/${id}/`,
      payload
    )
    return data
  },

  deleteSupplier: async (id: number): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}/`)
  },
}