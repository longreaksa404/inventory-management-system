// src/api/reports.ts
import { apiClient } from "./client"
import type {
  InventoryValueReport,
  LowStockItem,
  CategorySummary,
  TransactionHistoryItem,
} from "@/types"

export const reportsApi = {
  getInventoryValue: async (): Promise<InventoryValueReport> => {
    const { data } = await apiClient.get<InventoryValueReport>(
      "/reports/inventory-value/"
    )
    return data
  },

  getLowStock: async (): Promise<LowStockItem[]> => {
    const { data } = await apiClient.get<LowStockItem[]>("/reports/low-stock/")
    return data
  },

  getCategorySummary: async (): Promise<CategorySummary[]> => {
    const { data } = await apiClient.get<CategorySummary[]>(
      "/reports/category-summary/"
    )
    return data
  },

  getTransactionHistory: async (): Promise<TransactionHistoryItem[]> => {
    const { data } = await apiClient.get<TransactionHistoryItem[]>(
      "/reports/transaction-history/"
    )
    return data
  },
}