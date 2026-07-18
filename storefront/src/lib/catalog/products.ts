/**
 * Catalog products API — WooCommerce only.
 */

import type { MainCategory } from '@/lib/category-map'
import type { Connection, Product, ProductListItem } from '@/lib/catalog/types'
import * as wooProducts from '@/lib/wordpress/products'

interface GetProductsOptions {
  first?: number
  after?: string
  query?: string
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT' | 'UPDATED_AT' | 'RELEVANCE'
  reverse?: boolean
  page?: number
  perPage?: number
  search?: string
  category?: string
}

export const PRODUCTS_PAGE_SIZE = 24

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<Connection<ProductListItem>> {
  const orderby =
    options.sortKey === 'PRICE'
      ? 'price'
      : options.sortKey === 'TITLE'
        ? 'title'
        : 'popularity'
  const order = options.reverse ? 'asc' : 'desc'
  const result = await wooProducts.getWooProducts({
    page: options.page ?? 1,
    perPage: options.first ?? options.perPage ?? 24,
    search: options.search ?? options.query,
    category: options.category,
    orderby,
    order,
  })
  return {
    edges: result.edges.map((e) => ({ node: e.node, cursor: e.node.handle })),
    pageInfo: result.pageInfo,
  }
}

export async function getProductsAccumulated(
  options: GetProductsOptions & { pages?: number | 'all' } = {},
) {
  return wooProducts.getWooProductsAccumulated({
    perPage: options.perPage ?? options.first,
    pages: options.pages,
    search: options.search ?? options.query,
    category: options.category,
  })
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  return wooProducts.getWooProductBySlug(handle)
}

export async function getFeaturedProducts(count = 8): Promise<ProductListItem[]> {
  return wooProducts.getWooFeaturedProducts(count)
}

export async function getBundleProducts(count = 48): Promise<ProductListItem[]> {
  return wooProducts.getWooBundleProducts(count)
}

export async function getAllProductHandlesForSitemap(): Promise<
  Array<{ handle: string; updatedAt: string }>
> {
  return wooProducts.getWooAllProductHandlesForSitemap()
}

export async function getRelatedProducts(
  categorySlug: MainCategory,
  excludeHandle: string,
  count = 4,
): Promise<ProductListItem[]> {
  return wooProducts.getWooRelatedProducts(categorySlug, excludeHandle, count)
}

export function getProductCompositionHtml(product: Product): string | null {
  return wooProducts.getWooProductCompositionHtml(product)
}
