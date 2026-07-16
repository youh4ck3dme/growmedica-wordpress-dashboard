export type ShopifyAdminConfig = {
  store: string
  apiVersion: string
}

export type AdminProductSummary = {
  id: string
  handle: string
  title: string
  status: string
  price: string
  currency: string
  available: boolean
  inventoryQuantity: number | null
}

export type AdminProductDetail = AdminProductSummary & {
  description: string
  variantId: string
  productId: string
}

export type AdminOrderSummary = {
  id: string
  name: string
  createdAt: string
  financialStatus: string
  fulfillmentStatus: string
  total: string
  currency: string
  customerName: string
  customerEmail: string
}

export type AdminInventoryItem = {
  handle: string
  title: string
  variantId: string
  sku: string | null
  quantity: number | null
  tracked: boolean
  available: boolean
}

export type ProductUpdateInput = {
  title?: string
  description?: string
  price?: string
  available?: boolean
  inventoryQuantity?: number
}
