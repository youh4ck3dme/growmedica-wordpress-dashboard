export type NavCollectionItem = {
  handle: string
  title: string
  description: string | null
  href: string
  productCount: number
  icon?: string
  menuLabel: string
  source: 'shopify' | 'catalog'
}

export type CollectionView = {
  handle: string
  title: string
  description: string | null
  products: import('@/lib/shopify/types').ProductListItem[]
  availableVendors: string[]
  source: 'shopify' | 'catalog'
  page: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalOnPage: number
}

export type CollectionListOptions = {
  page?: number
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'title'
  vendor?: string
  inStockOnly?: boolean
}
