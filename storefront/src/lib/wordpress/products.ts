import { clampWooPerPage, wooFetch, wooFetchPaginated } from './client'
import { resolveWooVendor, wooProductToListItem, wooProductToProduct } from './adapter'
import { isWooMockMode, getMockWooProducts, getMockWooProductBySlug } from './mock'
import { getWooCategoryBySlug } from './categories'
import type { MainCategory } from '@/lib/category-map'
import type { Product, ProductListItem } from '@/lib/catalog/types'
import type { WooProduct } from './types'

interface GetWooProductsOptions {
  page?: number
  perPage?: number
  search?: string
  category?: string
  orderby?: 'date' | 'title' | 'popularity' | 'rating' | 'price'
  order?: 'asc' | 'desc'
  /** UI locale for localized title/description meta (gm_i18n / name_en / …). */
  locale?: string | null
}

export async function getWooProducts(options: GetWooProductsOptions = {}) {
  const {
    page = 1,
    perPage: perPageInput = WOO_PRODUCTS_PAGE_SIZE,
    search,
    category,
    orderby = 'popularity',
    order = 'desc',
    locale,
  } = options
  const perPage = resolvePerPage(perPageInput)

  if (isWooMockMode()) {
    const result = getMockWooProducts({ page, perPage, search, category })
    return {
      edges: result.items.map((product) => ({
        node: wooProductToListItem(product, locale),
      })),
      pageInfo: {
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
        startCursor: null,
        endCursor: null,
      },
      total: result.total,
      pageSize: result.perPage,
    }
  }

  let categoryId: string | undefined
  if (category) {
    // Accept numeric Woo term ID directly (preferred after taxonomy import;
    // WP may suffix category slugs when names collide).
    if (/^\d+$/.test(category)) {
      categoryId = category
    } else {
      const cat = await getWooCategoryBySlug(category)
      categoryId = cat ? String(cat.id) : undefined
    }
  }

  const result = await wooFetchPaginated<WooProduct>({
    path: '/products',
    params: {
      page,
      per_page: perPage,
      search,
      category: categoryId,
      orderby,
      order,
      status: 'publish',
    },
    tags: ['woo-products'],
    revalidate: 3600,
  })

  return {
    edges: result.items.map((product) => ({
      node: wooProductToListItem(product, locale),
    })),
    pageInfo: {
      hasNextPage: result.page < result.totalPages,
      hasPreviousPage: result.page > 1,
      startCursor: null,
      endCursor: null,
    },
    total: result.total,
    pageSize: result.perPage,
  }
}

export async function getWooProductById(
  id: number,
  locale?: string | null,
): Promise<Product | null> {
  if (isWooMockMode()) {
    const result = getMockWooProducts({ page: 1, perPage: 200 })
    const product = result.items.find((p) => p.id === id)
    return product ? wooProductToProduct(product, locale) : null
  }

  const product = await wooFetch<WooProduct>({
    path: `/products/${id}`,
    tags: [`woo-product-id-${id}`],
    revalidate: 3600,
  })

  return product ? wooProductToProduct(product, locale) : null
}

export async function getWooProductBySlug(
  slug: string,
  locale?: string | null,
): Promise<Product | null> {
  if (isWooMockMode()) {
    const product = getMockWooProductBySlug(slug)
    if (!product) return null
    // mock helper already returns Product shape; re-resolve via raw if available
    return product
  }

  const products = await wooFetch<WooProduct[]>({
    path: '/products',
    params: { slug, status: 'publish' },
    tags: [`woo-product-${slug}`],
    revalidate: 3600,
  })

  const product = products[0]
  return product ? wooProductToProduct(product, locale) : null
}

/** Woo category slugs that belong to the Balíčky / bundles merchandising, not singles. */
const BUNDLE_CATEGORY_SLUGS = new Set(['balicky-zdravia', 'balicky', 'balicky-zdravi'])

/**
 * Health-bundle / pack products shown in BundleShowcase — keep them out of
 * homepage "bestsellers" so that rail is a mix of regular singles.
 */
export function isWooBundleProduct(product: WooProduct): boolean {
  const slug = product.slug.toLowerCase()
  if (slug.startsWith('balicek-') || slug.includes('balicek')) return true

  if (
    product.categories.some((category) => BUNDLE_CATEGORY_SLUGS.has(category.slug.toLowerCase()))
  ) {
    return true
  }

  const name = product.name.toLowerCase()
  if (name.includes('balíček') || name.includes('balicek')) return true

  return product.tags.some((tag) => {
    const tagName = tag.name.toLowerCase()
    return tagName.startsWith('balicek-') || tagName === 'balicek-zdravia'
  })
}

function primaryMixCategorySlug(product: WooProduct): string {
  const preferred = product.categories.find(
    (category) =>
      category.slug !== 'nezaradene' && !BUNDLE_CATEGORY_SLUGS.has(category.slug.toLowerCase()),
  )
  return preferred?.slug ?? product.categories[0]?.slug ?? 'other'
}

/**
 * Prefer a real mix: unique category + brand first, then unique category, then fill.
 * Keeps homepage bestsellers from looking like another Balíčky strip.
 */
export function pickMixedNonBundleProducts(products: WooProduct[], count: number): WooProduct[] {
  const eligible = products.filter((product) => !isWooBundleProduct(product))
  const picked: WooProduct[] = []
  const usedCategories = new Set<string>()
  const usedVendors = new Set<string>()
  const seenIds = new Set<number>()

  const take = (product: WooProduct) => {
    seenIds.add(product.id)
    usedCategories.add(primaryMixCategorySlug(product))
    usedVendors.add(resolveWooVendor(product).toLowerCase())
    picked.push(product)
  }

  // Pass 1 — different category AND brand
  for (const product of eligible) {
    if (picked.length >= count) break
    if (seenIds.has(product.id)) continue
    const category = primaryMixCategorySlug(product)
    const vendor = resolveWooVendor(product).toLowerCase()
    if (usedCategories.has(category) || usedVendors.has(vendor)) continue
    take(product)
  }

  // Pass 2 — different category (brand may repeat once)
  for (const product of eligible) {
    if (picked.length >= count) break
    if (seenIds.has(product.id)) continue
    if (usedCategories.has(primaryMixCategorySlug(product))) continue
    take(product)
  }

  // Pass 3 — fill by popularity order
  for (const product of eligible) {
    if (picked.length >= count) break
    if (seenIds.has(product.id)) continue
    take(product)
  }

  return picked
}

export async function getWooFeaturedProducts(
  first = 8,
  locale?: string | null,
): Promise<ProductListItem[]> {
  if (isWooMockMode()) {
    const result = getMockWooProducts({ page: 1, perPage: first })
    return result.items.map((product) => wooProductToListItem(product, locale))
  }

  // Woo "featured"/popularity is dominated by balíčky — pull a wider pool and mix singles.
  const poolSize = resolvePerPage(Math.max(first * 12, 48))
  const pool: WooProduct[] = []
  const seen = new Set<number>()

  const appendUnique = (items: WooProduct[]) => {
    for (const item of items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      pool.push(item)
    }
  }

  const featured = await wooFetchPaginated<WooProduct>({
    path: '/products',
    params: {
      per_page: poolSize,
      featured: true,
      status: 'publish',
      orderby: 'popularity',
    },
    tags: ['woo-featured-products'],
    revalidate: 3600,
  })
  appendUnique(featured.items)

  let mixed = pickMixedNonBundleProducts(pool, first)

  if (mixed.length < first) {
    const popular = await wooFetchPaginated<WooProduct>({
      path: '/products',
      params: {
        per_page: poolSize,
        status: 'publish',
        orderby: 'popularity',
      },
      tags: ['woo-featured-products', 'woo-products'],
      revalidate: 3600,
    })
    appendUnique(popular.items)
    mixed = pickMixedNonBundleProducts(pool, first)
  }

  // Still short (many top sellers are bundles) — second page of popularity.
  if (mixed.length < first) {
    const popularPage2 = await wooFetchPaginated<WooProduct>({
      path: '/products',
      params: {
        page: 2,
        per_page: poolSize,
        status: 'publish',
        orderby: 'popularity',
      },
      tags: ['woo-featured-products', 'woo-products'],
      revalidate: 3600,
    })
    appendUnique(popularPage2.items)
    mixed = pickMixedNonBundleProducts(pool, first)
  }

  return mixed.map((product) => wooProductToListItem(product, locale))
}

export const WOO_PRODUCTS_PAGE_SIZE = 48

function resolvePerPage(value?: number): number {
  return clampWooPerPage(value, WOO_PRODUCTS_PAGE_SIZE)
}

export async function getWooProductsAccumulated(
  options: GetWooProductsOptions & { pages?: number | 'all' } = {},
) {
  const pageSize = resolvePerPage(options.perPage)
  const pages = options.pages === 'all' ? Number.POSITIVE_INFINITY : Math.max(1, options.pages ?? 1)

  const mergedEdges: Array<{ node: ProductListItem }> = []
  let pageInfo = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null as string | null,
    endCursor: null as string | null,
  }

  for (let page = 1; page <= pages; page++) {
    const batch = await getWooProducts({ ...options, page, perPage: pageSize })
    mergedEdges.push(...batch.edges)
    pageInfo = batch.pageInfo
    if (!batch.pageInfo.hasNextPage) break
  }

  return { edges: mergedEdges, pageInfo, pageSize }
}

export async function getWooRelatedProducts(
  categorySlug: MainCategory,
  excludeHandle: string,
  count = 4,
  locale?: string | null,
): Promise<ProductListItem[]> {
  if (categorySlug === 'ostatne') return []

  const result = await getWooProducts({
    category: categorySlug,
    perPage: count + 8,
    orderby: 'popularity',
    locale,
  })

  return result.edges
    .map((e) => e.node)
    .filter((p) => p.handle !== excludeHandle)
    .slice(0, count)
}

export async function getWooAllProductHandlesForSitemap(): Promise<
  Array<{ handle: string; updatedAt: string }>
> {
  if (isWooMockMode()) {
    const result = getMockWooProducts({ page: 1, perPage: 100 })
    return result.items.map((p) => ({ handle: p.slug, updatedAt: p.date_modified_gmt }))
  }

  const handles: Array<{ handle: string; updatedAt: string }> = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result = await wooFetchPaginated<WooProduct>({
      path: '/products',
      params: { page, per_page: 100, status: 'publish' },
      revalidate: 86400,
    })
    for (const product of result.items) {
      handles.push({ handle: product.slug, updatedAt: product.date_modified_gmt })
    }
    totalPages = result.totalPages
    page++
  }

  return handles
}

export function getWooProductCompositionHtml(product: Product): string | null {
  const html = product.descriptionHtml?.trim()
  if (!html) return null
  return html.includes('<') ? html : `<p>${html}</p>`
}

export async function getWooBundleProducts(
  count = 48,
  locale?: string | null,
): Promise<ProductListItem[]> {
  const result = await getWooProducts({
    perPage: count,
    search: 'balicek',
    orderby: 'title',
    order: 'asc',
    locale,
  })
  return result.edges.map((e) => e.node)
}