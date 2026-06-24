// src/api/orders.ts
import { apiClient } from "./client"
import type {
  PurchaseOrder,
  PurchaseOrderPayload,
  SaleOrder,
  SaleOrderPayload,
  PaginatedResponse,
} from "@/types"

export const ordersApi = {
  // ─── Purchase Orders ───────────────────────────────────────────────────────

  getPurchaseOrders: async (params?: {
    page?: number
    status?: string
  }): Promise<PaginatedResponse<PurchaseOrder>> => {
    const { data } = await apiClient.get<PaginatedResponse<PurchaseOrder>>(
      "/orders/purchase-orders/",
      { params }
    )
    return data
  },

  getPurchaseOrder: async (id: number): Promise<PurchaseOrder> => {
    const { data } = await apiClient.get<PurchaseOrder>(
      `/orders/purchase-orders/${id}/`
    )
    return data
  },

  createPurchaseOrder: async (
    payload: PurchaseOrderPayload
  ): Promise<PurchaseOrder> => {
    const { data } = await apiClient.post<PurchaseOrder>(
      "/orders/purchase-orders/",
      payload
    )
    return data
  },

  confirmPurchaseOrder: async (id: number): Promise<{ detail: string }> => {
    const { data } = await apiClient.post<{ detail: string }>(
      `/orders/purchase-orders/${id}/confirm/`
    )
    return data
  },

  receivePurchaseOrder: async (id: number): Promise<{ detail: string }> => {
    const { data } = await apiClient.post<{ detail: string }>(
      `/orders/purchase-orders/${id}/receive/`
    )
    return data
  },

  // ─── Sale Orders ───────────────────────────────────────────────────────────

  getSaleOrders: async (params?: {
    page?: number
    status?: string
  }): Promise<PaginatedResponse<SaleOrder>> => {
    const { data } = await apiClient.get<PaginatedResponse<SaleOrder>>(
      "/orders/sales/",
      { params }
    )
    return data
  },

  getSaleOrder: async (id: number): Promise<SaleOrder> => {
    const { data } = await apiClient.get<SaleOrder>(`/orders/sales/${id}/`)
    return data
  },

  createSaleOrder: async (payload: SaleOrderPayload): Promise<SaleOrder> => {
    const { data } = await apiClient.post<SaleOrder>(
      "/orders/sales/",
      payload
    )
    return data
  },

  confirmSaleOrder: async (id: number): Promise<{ detail: string }> => {
    const { data } = await apiClient.post<{ detail: string }>(
      `/orders/sales/${id}/confirm/`
    )
    return data
  },

  shipSaleOrder: async (id: number): Promise<{ detail: string }> => {
    const { data } = await apiClient.post<{ detail: string }>(
      `/orders/sales/${id}/ship/`
    )
    return data
  },

  invoiceSaleOrder: async (id: number): Promise<{ detail: string }> => {
    const { data } = await apiClient.post<{ detail: string }>(
      `/orders/sales/${id}/invoice/`
    )
    return data
  },
}