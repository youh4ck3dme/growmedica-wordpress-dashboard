import { clampWooPerPage, wooFetch, wooFetchPaginated } from './client'
import { wooProductToListItem, wooProductToProduct } from './adapter'
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
}

export async function getWooProducts(options: GetWooProductsOptions = {}) {
  const {
    page = 1,
    perPage: perPageInput = WOO_PRODUCTS_PAGE_SIZE,
    search,
    category,
    orderby = 'popularity',
    order = 'desc',
  } = options
  const perPage = resolvePerPage(perPageInput)

  if (isWooMockMode()) {
    const result = getMockWooProducts({ page, perPage, search, category })
    return {
      edges: result.items.map((product) => ({
        node: wooProductToListItem(product),
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
      node: wooProductToListItem(product),
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

export async function getWooProductById(id: number): Promise<Product | null> {
  if (isWooMockMode()) {
    const result = getMockWooProducts({ page: 1, perPage: 200 })
    const product = result.items.find((p) => p.id === id)
    return product ? wooProductToProduct(product) : null
  }

  const product = await wooFetch<WooProduct>({
    path: `/products/${id}`,
    tags: [`woo-product-id-${id}`],
    revalidate: 3600,
  })

  return product ? wooProductToProduct(product) : null
}

export async function getWooProductBySlug(slug: string): Promise<Product | null> {
  if (isWooMockMode()) {
    return getMockWooProductBySlug(slug)
  }

  const products = await wooFetch<WooProduct[]>({
    path: '/products',
    params: { slug, status: 'publish' },
    tags: [`woo-product-${slug}`],
    revalidate: 3600,
  })

  const product = products[0]
  return product ? wooProductToProduct(product) : null
}

export async function getWooFeaturedProducts(first = 8): Promise<ProductListItem[]> {
  if (isWooMockMode()) {
    const result = getMockWooProducts({ page: 1, perPage: first })
    return result.items.map(wooProductToListItem)
  }

  const result = await wooFetchPaginated<WooProduct>({
    path: '/products',
    params: {
      per_page: resolvePerPage(first),
      featured: true,
      status: 'publish',
      orderby: 'popularity',
    },
    tags: ['woo-featured-products'],
    revalidate: 3600,
  })

  return result.items.map(wooProductToListItem)
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
): Promise<ProductListItem[]> {
  if (categorySlug === 'ostatne') return []

  const result = await getWooProducts({
    category: categorySlug,
    perPage: count + 8,
    orderby: 'popularity',
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

export async function getWooBundleProducts(count = 48): Promise<ProductListItem[]> {
  const result = await getWooProducts({
    perPage: count,
    search: 'balicek',
    orderby: 'title',
    order: 'asc',
  })
  return result.edges.map((e) => e.node)
}