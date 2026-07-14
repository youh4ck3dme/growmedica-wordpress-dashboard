/**
 * Resolves navigable categories from Shopify catalog via category-map.
 */

import {
  HIDDEN_COLLECTION_HANDLES,
  buildCategorySearchQuery,
  getCategoryDefinition,
  getNavCategories,
  normalizeCategorySlug,
  resolveCategory,
  type MainCategory,
} from '@/lib/category-map'
import { getCollectionUrl } from '@/lib/utils'
import { shopifyFetch } from './client'
import { getCollectionByHandle, getAllShopifyCollections } from './collections'
import { getProducts } from './products'
import type { ProductListItem } from './types'

import type {
  CollectionListOptions,
  CollectionView,
  NavCollectionItem,
} from '@/lib/catalog/nav-types'

export type { NavCollectionItem, CollectionView, CollectionListOptions }

const PAGE_SIZE = 24

type SortConfig = {
  sortKey: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT' | 'UPDATED_AT' | 'RELEVANCE'
  reverse: boolean
}

function resolveSort(sort?: CollectionListOptions['sort']): SortConfig {
  switch (sort) {
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false }
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true }
    case 'title':
      return { sortKey: 'TITLE', reverse: false }
    default:
      return { sortKey: 'BEST_SELLING', reverse: false }
  }
}

function escapeVendor(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function augmentProductQuery(
  base: string,
  vendor?: string,
  inStockOnly?: boolean,
): string {
  let query = base
  if (vendor) {
    query = `${query} AND vendor:'${escapeVendor(vendor)}'`
  }
  if (inStockOnly) {
    query = `${query} AND available_for_sale:true`
  }
  return query
}

function applyClientFilters(
  products: ProductListItem[],
  options: Pick<CollectionListOptions, 'vendor' | 'inStockOnly'>,
): ProductListItem[] {
  return products.filter((product) => {
    if (options.vendor && product.vendor !== options.vendor) return false
    if (options.inStockOnly && !product.availableForSale) return false
    return true
  })
}

function applyClientSort(
  products: ProductListItem[],
  sort?: CollectionListOptions['sort'],
): ProductListItem[] {
  const list = [...products]
  switch (sort) {
    case 'price-asc':
      return list.sort(
        (a, b) =>
          parseFloat(a.priceRange.minVariantPrice.amount) -
          parseFloat(b.priceRange.minVariantPrice.amount),
      )
    case 'price-desc':
      return list.sort(
        (a, b) =>
          parseFloat(b.priceRange.minVariantPrice.amount) -
          parseFloat(a.priceRange.minVariantPrice.amount),
      )
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title, 'sk'))
    default:
      return list
  }
}

function extractVendors(products: ProductListItem[]): string[] {
  return [...new Set(products.map((p) => p.vendor).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'sk'),
  )
}

async function getCatalogCategoryCounts(): Promise<Map<MainCategory, number>> {
  const counts = new Map<MainCategory, number>()
  for (const def of getNavCategories()) {
    counts.set(def.slug, 0)
  }
  counts.set('ostatne', 0)

  let hasNextPage = true
  let after: string | undefined

  while (hasNextPage) {
    const data = await shopifyFetch<{
      products: {
        edges: Array<{ node: { productType: string; tags: string[] } }>
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
      }
    }>({
      query: /* GraphQL */ `
        query CatalogCategoryCounts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            pageInfo { hasNextPage endCursor }
            edges { node { productType tags } }
          }
        }
      `,
      variables: { first: 250, after },
      tags: ['products', 'catalog-nav'],
      revalidate: 3600,
    })

    for (const { node } of data.products.edges) {
      const slug = resolveCategory(node)
      counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }

    hasNextPage = data.products.pageInfo.hasNextPage
    after = data.products.pageInfo.endCursor ?? undefined
  }

  return counts
}

export async function getNavCollectionItems(): Promise<NavCollectionItem[]> {
  const [shopifyCollections, catalogCounts] = await Promise.all([
    getAllShopifyCollections(),
    getCatalogCategoryCounts(),
  ])

  const shopifyByHandle = new Map(
    shopifyCollections
      .filter((c) => !HIDDEN_COLLECTION_HANDLES.has(c.handle))
      .map((c) => [c.handle, c])
  )

  const items: NavCollectionItem[] = []
  const seenHandles = new Set<string>()

  for (const def of getNavCategories()) {
    const shopify = shopifyByHandle.get(def.slug)
    const productCount = catalogCounts.get(def.slug) ?? 0

    if (productCount === 0 && !shopify) continue
    if (def.slug === 'ostatne' && productCount === 0) continue

    seenHandles.add(def.slug)
    items.push({
      handle: def.slug,
      title: shopify?.title ?? def.title,
      description: shopify?.description ?? def.description ?? null,
      href: getCollectionUrl(def.slug),
      productCount,
      icon: def.icon,
      menuLabel: def.menuLabel,
      source: shopify ? 'shopify' : 'catalog',
    })
  }

  for (const shopify of shopifyCollections) {
    if (HIDDEN_COLLECTION_HANDLES.has(shopify.handle) || seenHandles.has(shopify.handle)) {
      continue
    }

    const withProducts = await getCollectionByHandle(shopify.handle, 1)
    const productCount = withProducts?.products?.edges?.length ?? 0
    if (productCount === 0) continue

    items.push({
      handle: shopify.handle,
      title: shopify.title,
      description: shopify.description ?? null,
      href: getCollectionUrl(shopify.handle),
      productCount,
      menuLabel: shopify.title.toUpperCase(),
      source: 'shopify',
    })
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, 'sk'))
}

export async function getCollectionViewByHandle(
  handle: string,
  options: CollectionListOptions = {},
): Promise<CollectionView | null> {
  const page = Math.max(1, options.page ?? 1)
  const { sort, vendor, inStockOnly } = options

  if (HIDDEN_COLLECTION_HANDLES.has(handle)) {
    return null
  }

  const slug = normalizeCategorySlug(handle)
  if (!slug) return null

  const def = getCategoryDefinition(slug)
  if (slug === 'ostatne') {
    return null
  }

  const shopifyCollection = await getCollectionByHandle(slug, PAGE_SIZE)
  if (shopifyCollection) {
    let currentCollection = shopifyCollection
    const availableVendors = extractVendors(
      currentCollection.products?.edges?.map((e) => e.node) ?? [],
    )

    for (let i = 1; i < page; i++) {
      const pageInfo = currentCollection.products.pageInfo
      if (!pageInfo.hasNextPage) {
        return null
      }

      const nextCollection = await getCollectionByHandle(
        slug,
        PAGE_SIZE,
        pageInfo.endCursor ?? undefined,
      )
      if (!nextCollection) return null
      currentCollection = nextCollection
    }

    const rawProducts = currentCollection.products?.edges?.map((e) => e.node) ?? []
    if (rawProducts.length > 0) {
      const products = applyClientSort(
        applyClientFilters(rawProducts, { vendor, inStockOnly }),
        sort,
      )
      return {
        handle: slug,
        title: shopifyCollection.title,
        description: shopifyCollection.description ?? def.description ?? null,
        products,
        availableVendors,
        source: 'shopify',
        page,
        hasNextPage: currentCollection.products.pageInfo.hasNextPage,
        hasPreviousPage: page > 1,
        totalOnPage: products.length,
      }
    }

    if (page > 1) {
      return {
        handle: slug,
        title: shopifyCollection.title,
        description: shopifyCollection.description ?? def.description ?? null,
        products: [],
        availableVendors,
        source: 'shopify',
        page,
        hasNextPage: currentCollection.products.pageInfo.hasNextPage,
        hasPreviousPage: true,
        totalOnPage: 0,
      }
    }
  }

  const baseQuery = buildCategorySearchQuery(slug)
  if (!baseQuery) return null

  const query = augmentProductQuery(baseQuery, vendor, inStockOnly)
  const { sortKey, reverse } = resolveSort(sort)

  const vendorSample = await getProducts({
    first: 50,
    query: baseQuery,
    sortKey: 'BEST_SELLING',
  })
  const availableVendors = extractVendors(vendorSample.edges.map((e) => e.node))

  let after: string | undefined
  for (let i = 1; i < page; i++) {
    const skip = await getProducts({ first: PAGE_SIZE, after, query, sortKey, reverse })
    if (!skip.pageInfo.hasNextPage) {
      return null
    }
    after = skip.pageInfo.endCursor ?? undefined
  }

  const result = await getProducts({
    first: PAGE_SIZE,
    after,
    query,
    sortKey,
    reverse,
  })

  const products = result.edges.map((e) => e.node)

  // page 1 with no products → category is genuinely empty (return null → 404)
  // page > 1 with no products → valid empty page, return CollectionView with products: []
  if (products.length === 0 && page === 1) return null

  return {
    handle: slug,
    title: def.title,
    description: def.description ?? null,
    products,
    availableVendors,
    source: 'catalog',
    page,
    hasNextPage: result.pageInfo.hasNextPage,
    hasPreviousPage: page > 1,
    totalOnPage: products.length,
  }
}

/** Top products for mega menu sidebar (cached via shopifyFetch). */
export async function getCategoryFeaturedProducts(
  handle: string,
  count = 3
): Promise<ProductListItem[]> {
  const slug = normalizeCategorySlug(handle)
  if (!slug || slug === 'ostatne') return []

  const shopifyCollection = await getCollectionByHandle(slug, count)
  const fromCollection =
    shopifyCollection?.products?.edges?.map((e) => e.node).slice(0, count) ?? []
  if (fromCollection.length > 0) return fromCollection

  const query = buildCategorySearchQuery(slug)
  if (!query) return []

  const result = await getProducts({
    first: count,
    query,
    sortKey: 'BEST_SELLING',
  })

  return result.edges.map((e) => e.node)
}
