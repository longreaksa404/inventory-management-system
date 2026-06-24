// src/api/products.ts
import { apiClient } from "./client"
import type {
  Product,
  ProductPayload,
  PaginatedResponse,
  StockTransaction,
  StockMutationPayload,
  AdjustStockPayload,
  Category,
  CategoryPayload,
} from "@/types"

export const productsApi = {
  // ─── Categories ────────────────────────────────────────────────────────────

  getCategories: async (): Promise<PaginatedResponse<Category>> => {
    const { data } = await apiClient.get<PaginatedResponse<Category>>(
      "/inventory/categories/"
    )
    return data
  },

  createCategory: async (payload: CategoryPayload): Promise<Category> => {
    const { data } = await apiClient.post<Category>(
      "/inventory/categories/",
      payload
    )
    return data
  },

  updateCategory: async (
    id: number,
    payload: CategoryPayload
  ): Promise<Category> => {
    const { data } = await apiClient.put<Category>(
      `/inventory/categories/${id}/`,
      payload
    )
    return data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/inventory/categories/${id}/`)
  },

  // ─── Products ──────────────────────────────────────────────────────────────

  getProducts: async (params?: {
    page?: number
    search?: string
    category?: number
    status?: string
    ordering?: string
  }): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>(
      "/inventory/products/",
      { params }
    )
    return data
  },

  getProduct: async (id: number): Promise<Product> => {
    const { data } = await apiClient.get<Product>(
      `/inventory/products/${id}/`
    )
    return data
  },

  createProduct: async (payload: ProductPayload): Promise<Product> => {
    const { data } = await apiClient.post<Product>(
      "/inventory/products/",
      payload
    )
    return data
  },

  updateProduct: async (
    id: number,
    payload: Partial<ProductPayload>
  ): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(
      `/inventory/products/${id}/`,
      payload
    )
    return data
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/inventory/products/${id}/`)
  },

  // ─── Stock mutations ───────────────────────────────────────────────────────

  stockIn: async (
    productId: number,
    payload: StockMutationPayload
  ): Promise<{ stock: number }> => {
    const { data } = await apiClient.post<{ stock: number }>(
      `/inventory/products/${productId}/stock/in/`,
      payload
    )
    return data
  },

  stockOut: async (
    productId: number,
    payload: StockMutationPayload
  ): Promise<{ stock: number }> => {
    const { data } = await apiClient.post<{ stock: number }>(
      `/inventory/products/${productId}/stock/out/`,
      payload
    )
    return data
  },

  adjustStock: async (
    productId: number,
    payload: AdjustStockPayload
  ): Promise<{ stock: number }> => {
    const { data } = await apiClient.post<{ stock: number }>(
      `/inventory/products/${productId}/stock/adjust/`,
      payload
    )
    return data
  },

  // ─── Stock history ─────────────────────────────────────────────────────────

  getStockHistory: async (
    productId: number
  ): Promise<PaginatedResponse<StockTransaction>> => {
    const { data } = await apiClient.get<PaginatedResponse<StockTransaction>>(
      `/inventory/stock-history/${productId}/`
    )
    return data
  },

  getTransactions: async (params?: {
    page?: number
    product?: number
    warehouse?: number
    transaction_type?: string
  }): Promise<PaginatedResponse<StockTransaction>> => {
    const { data } = await apiClient.get<PaginatedResponse<StockTransaction>>(
      "/inventory/transactions/",
      { params }
    )
    return data
  },
}