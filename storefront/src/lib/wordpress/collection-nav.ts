/**
 * WooCommerce collection navigation — category-map driven (mirrors shopify/collection-nav).
 */

import {
  getCategoryDefinition,
  getNavCategories,
  normalizeCategorySlug,
  type MainCategory,
} from '@/lib/category-map'
import { getCollectionUrl } from '@/lib/utils'
import type { ProductListItem } from '@/lib/shopify/types'
import type {
  CollectionListOptions,
  CollectionView,
  NavCollectionItem,
} from '@/lib/catalog/nav-types'
import { getWooCategories } from './categories'
import { getWooProducts } from './products'
import { isWooMockMode, getMockWooCategories, getMockWooProducts } from './mock'
import { getSeoTaxonomyFeaturedProducts } from '@/lib/seo-taxonomy'
import { getSkMenuNavItems } from '@/lib/navigation/sk-menu-nav'

export type { NavCollectionItem, CollectionView, CollectionListOptions }

const PAGE_SIZE = 24

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

async function fetchCategoryCounts(): Promise<Map<string, number>> {
  const categories = isWooMockMode() ? getMockWooCategories() : await getWooCategories()
  const counts = new Map<string, number>()
  for (const cat of categories) {
    counts.set(cat.slug, cat.count)
  }
  return counts
}

export async function getWooNavCollectionItems(): Promise<NavCollectionItem[]> {
  // Live Woo: mirror growmedica.sk main menu (full hierarchy), not SEO L1/L2-only slice.
  if (!isWooMockMode()) return getSkMenuNavItems()
  const counts = await fetchCategoryCounts()

  const items: NavCollectionItem[] = []
  for (const def of getNavCategories()) {
    const productCount = counts.get(def.slug) ?? 0
    if (productCount === 0 && def.slug !== 'proteiny') continue

    items.push({
      handle: def.slug,
      title: def.title,
      description: def.description ?? null,
      href: getCollectionUrl(def.slug),
      productCount,
      icon: def.icon,
      menuLabel: def.menuLabel,
      source: 'catalog',
    })
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, 'sk'))
}

export async function getWooCollectionViewByHandle(
  handle: string,
  options: CollectionListOptions = {},
): Promise<CollectionView | null> {
  const page = Math.max(1, options.page ?? 1)
  const slug = normalizeCategorySlug(handle)
  if (!slug || slug === 'ostatne') return null

  const def = getCategoryDefinition(slug)
  const { sort, vendor, inStockOnly } = options

  const orderby =
    sort === 'price-asc' || sort === 'price-desc'
      ? 'price'
      : sort === 'title'
        ? 'title'
        : 'popularity'
  const order = sort === 'price-asc' || sort === 'title' ? 'asc' : 'desc'

  const result = await getWooProducts({ page, perPage: PAGE_SIZE, category: slug, orderby, order })

  const rawProducts = result.edges.map((e) => e.node)
  if (rawProducts.length === 0 && page === 1) return null

  const vendorSample = await getWooProducts({ page: 1, perPage: 50, category: slug })
  const availableVendors = extractVendors(vendorSample.edges.map((e) => e.node))

  const products = applyClientSort(
    applyClientFilters(rawProducts, { vendor, inStockOnly }),
    sort,
  )

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

export async function getWooCategoryFeaturedProducts(
  handle: string,
  count = 3,
): Promise<ProductListItem[]> {
  if (!isWooMockMode() && handle.includes('/')) {
    return getSeoTaxonomyFeaturedProducts(handle, count)
  }
  const slug = normalizeCategorySlug(handle) as MainCategory | null
  if (!slug || slug === 'ostatne') return []

  const result = await getWooProducts({ page: 1, perPage: count, category: slug, orderby: 'popularity' })

  return result.edges.map((e) => e.node).slice(0, count)
}
