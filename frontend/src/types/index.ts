// src/types/index.ts

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "staff" | "customer"

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  phone_number: string
  role: UserRole
  is_staff: boolean
  date_joined: string
}

export interface TokenPair {
  access: string
  refresh: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Warehouse ───────────────────────────────────────────────────────────────

export interface Warehouse {
  id: number
  name: string
  code: string
  location: string
  contact_person: string
  phone: string
  email: string
  notes: string
  created_at: string
  updated_at: string
}

export interface WarehousePayload {
  name: string
  code: string
  location?: string
  contact_person?: string
  phone?: string
  email: string
  notes?: string
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface CategoryPayload {
  name: string
  description?: string
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductStatus = "active" | "discontinued" | "out_of_stock"

export interface Product {
  id: number
  name: string
  sku: string
  status: ProductStatus
  category: number
  category_name: string
  price: string
  quantity: number
  reorder_level: number
}

export interface ProductPayload {
  name: string
  sku: string
  status?: ProductStatus
  category: number
  price: string
  quantity?: number
  reorder_level?: number
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export type TransactionType = "IN" | "OUT" | "ADJ"

export interface StockTransaction {
  id: number
  product: number
  product_name: string
  warehouse: number
  warehouse_name: string
  performed_by: number
  performed_by_name: string
  transaction_type: TransactionType
  quantity: number
  notes: string
  timestamp: string
}

export interface StockMutationPayload {
  quantity: number
  warehouse: number
  notes?: string
}

export interface AdjustStockPayload {
  quantity: number
  warehouse: number
  reason?: string
}

// ─── Supplier ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: number
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface SupplierPayload {
  name: string
  contact_name: string
  email?: string
  phone: string
  address: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "shipped"
  | "received"
  | "invoiced"
  | "completed"
  | "cancelled"

export interface PurchaseOrderItem {
  id: number
  product: number
  product_name: string
  quantity: number
  unit_price: string
  notes: string
  line_total: string
}

export interface PurchaseOrderItemPayload {
  product: number
  quantity: number
  unit_price: string
  notes?: string
}

export interface PurchaseOrder {
  id: number
  supplier: number
  supplier_name: string
  warehouse: number
  warehouse_name: string
  status: OrderStatus
  expected_date: string | null
  notes: string
  created_at: string
  updated_at: string
  created_by: string
  items_detail: PurchaseOrderItem[]
}

export interface PurchaseOrderPayload {
  supplier: number
  warehouse: number
  expected_date?: string
  notes?: string
  items: PurchaseOrderItemPayload[]
}

export interface SaleOrderItem {
  id: number
  product: number
  product_name: string
  quantity: number
  unit_price: string
  discount: string
  notes: string
  line_total: string
}

export interface SaleOrderItemPayload {
  product: number
  quantity: number
  unit_price: string
  discount?: string
  notes?: string
}

export interface SaleOrder {
  id: number
  customer: number
  customer_name: string
  warehouse: number
  warehouse_name: string
  status: OrderStatus
  order_date: string
  shipped_date: string | null
  notes: string
  created_at: string
  updated_at: string
  created_by: string
  items_detail: SaleOrderItem[]
}

export interface SaleOrderPayload {
  customer: number
  warehouse: number
  notes?: string
  items: SaleOrderItemPayload[]
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface InventoryValueReport {
  total_value: number
  snapshot: {
    warehouse: number | null
    total_value: number
  }
}

export interface LowStockItem {
  product: number
  product_name: string
  warehouse: number
  warehouse_name: string
  quantity: number
  reorder_level: number
}

export interface CategorySummary {
  category_id: number
  category_name: string
  total_quantity: number
  total_value: number
}

export interface TransactionHistoryItem {
  transaction_type: "purchase" | "sale"
  order_id: number
  supplier?: string
  customer?: string
  status: OrderStatus
  created_at: string
}