/**
 * Shopify TypeScript Types
 * Based on Shopify Storefront API 2025-01
 */

// ─── Money ───────────────────────────────────────────────────────────────────

export interface Money {
  amount: string
  currencyCode: string
}

// ─── Image ───────────────────────────────────────────────────────────────────

export interface ShopifyImage {
  id?: string
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

// ─── Variant ─────────────────────────────────────────────────────────────────

export interface SelectedOption {
  name: string
  value: string
}

export interface ProductVariant {
  id: string
  title: string
  availableForSale: boolean
  selectedOptions: SelectedOption[]
  price: Money
  compareAtPrice: Money | null
  sku: string | null
  quantityAvailable: number | null
  image: ShopifyImage | null
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ProductOption {
  id: string
  name: string
  values: string[]
}

export interface Product {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  vendor: string
  productType: string
  tags: string[]
  availableForSale: boolean
  options: ProductOption[]
  priceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  compareAtPriceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  variants: {
    edges: Array<{
      node: ProductVariant
    }>
  }
  images: {
    edges: Array<{
      node: ShopifyImage
    }>
  }
  featuredImage: ShopifyImage | null
  seo: {
    title: string | null
    description: string | null
  }
  metafields?: Array<{
    namespace: string
    key: string
    value: string
    type: string
  } | null> | null
  updatedAt: string
}

export interface ProductListItem {
  id: string
  handle: string
  title: string
  vendor: string
  productType: string
  tags: string[]
  availableForSale: boolean
  priceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  compareAtPriceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  featuredImage: ShopifyImage | null
  variants: {
    edges: Array<{
      node: Pick<ProductVariant, 'id' | 'title' | 'availableForSale' | 'selectedOptions' | 'price' | 'compareAtPrice'>
    }>
  }
}

// ─── Collection ──────────────────────────────────────────────────────────────

export interface Collection {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  image: ShopifyImage | null
  seo: {
    title: string | null
    description: string | null
  }
  updatedAt: string
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    selectedOptions: SelectedOption[]
    product: {
      id: string
      handle: string
      title: string
      featuredImage: ShopifyImage | null
    }
  }
  cost: {
    totalAmount: Money
    subtotalAmount: Money
  }
}

export interface DiscountCode {
  code: string
  applicable: boolean
}

export interface Cart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: {
    edges: Array<{
      node: CartLine
    }>
  }
  cost: {
    subtotalAmount: Money
    totalAmount: Money
    totalTaxAmount: Money | null
  }
  discountCodes?: DiscountCode[]
}

// ─── GraphQL Response ─────────────────────────────────────────────────────────

export interface ShopifyGraphQLError {
  message: string
  locations?: Array<{ line: number; column: number }>
  path?: string[]
}

export interface ShopifyResponse<T> {
  data: T
  errors?: ShopifyGraphQLError[]
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface Connection<T> {
  edges: Array<{
    node: T
    cursor: string
  }>
  pageInfo: PageInfo
}
