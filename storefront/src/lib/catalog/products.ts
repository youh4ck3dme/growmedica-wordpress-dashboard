/**
 * Unified catalog API — routes to Shopify or WordPress/WooCommerce.
 */

import { isWordPressCms } from '@/lib/cms'
import type { MainCategory } from '@/lib/category-map'
import type { Connection, Product, ProductListItem } from '@/lib/shopify/types'
import * as shopifyProducts from '@/lib/shopify/products'
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

export const PRODUCTS_PAGE_SIZE = shopifyProducts.PRODUCTS_PAGE_SIZE

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<Connection<ProductListItem>> {
  if (isWordPressCms()) {
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

  return shopifyProducts.getProducts(options)
}

export async function getProductsAccumulated(
  options: GetProductsOptions & { pages?: number | 'all' } = {},
) {
  if (isWordPressCms()) {
    return wooProducts.getWooProductsAccumulated({
      perPage: options.first,
      pages: options.pages,
      search: options.search ?? options.query,
      category: options.category,
    })
  }

  return shopifyProducts.getProductsAccumulated(options)
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  if (isWordPressCms()) {
    return wooProducts.getWooProductBySlug(handle)
  }
  return shopifyProducts.getProductByHandle(handle)
}

export async function getFeaturedProducts(count = 8): Promise<ProductListItem[]> {
  if (isWordPressCms()) {
    return wooProducts.getWooFeaturedProducts(count)
  }
  return shopifyProducts.getFeaturedProducts(count)
}

export async function getBundleProducts(count = 48): Promise<ProductListItem[]> {
  if (isWordPressCms()) {
    return wooProducts.getWooBundleProducts(count)
  }
  return shopifyProducts.getBundleProducts(count)
}

export async function getAllProductHandlesForSitemap(): Promise<
  Array<{ handle: string; updatedAt: string }>
> {
  if (isWordPressCms()) {
    return wooProducts.getWooAllProductHandlesForSitemap()
  }
  return shopifyProducts.getAllProductHandlesForSitemap()
}

export async function getRelatedProducts(
  categorySlug: MainCategory,
  excludeHandle: string,
  count = 4,
): Promise<ProductListItem[]> {
  if (isWordPressCms()) {
    return wooProducts.getWooRelatedProducts(categorySlug, excludeHandle, count)
  }
  return shopifyProducts.getRelatedProducts(categorySlug, excludeHandle, count)
}

export function getProductCompositionHtml(product: Product): string | null {
  if (isWordPressCms()) {
    return wooProducts.getWooProductCompositionHtml(product)
  }
  return shopifyProducts.getProductCompositionHtml(product)
}
