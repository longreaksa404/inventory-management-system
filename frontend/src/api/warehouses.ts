// src/api/warehouses.ts
import { apiClient } from "./client"
import type { Warehouse, WarehousePayload, PaginatedResponse } from "@/types"

export const warehousesApi = {
  getWarehouses: async (): Promise<PaginatedResponse<Warehouse>> => {
    const { data } = await apiClient.get<PaginatedResponse<Warehouse>>(
      "/warehouses/"
    )
    return data
  },

  getWarehouse: async (id: number): Promise<Warehouse> => {
    const { data } = await apiClient.get<Warehouse>(`/warehouses/${id}/`)
    return data
  },

  createWarehouse: async (payload: WarehousePayload): Promise<Warehouse> => {
    const { data } = await apiClient.post<Warehouse>("/warehouses/", payload)
    return data
  },

  updateWarehouse: async (
    id: number,
    payload: Partial<WarehousePayload>
  ): Promise<Warehouse> => {
    const { data } = await apiClient.patch<Warehouse>(
      `/warehouses/${id}/`,
      payload
    )
    return data
  },

  deleteWarehouse: async (id: number): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}/`)
  },
}