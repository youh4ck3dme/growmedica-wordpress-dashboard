export type NavCollectionItem = {
  handle: string
  title: string
  description: string | null
  href: string
  productCount: number
  icon?: string
  menuLabel: string
  source: 'shopify' | 'catalog'
  /** Woo product category image (thumbnail) when available */
  imageUrl?: string | null
  /** Nested children when menu mirrors growmedica.sk hierarchy */
  children?: NavCollectionItem[]
}

export function shouldIncludeMegaMenuCollection(
  collection: Pick<NavCollectionItem, 'productCount' | 'children'>,
): boolean {
  return collection.productCount > 0 || Boolean(collection.children?.length)
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
