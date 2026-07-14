import { wooFetch } from './client'
import { isWooMockMode, getMockWooCategories } from './mock'
import type { WooCategory } from './types'

export async function getWooCategories(): Promise<WooCategory[]> {
  if (isWooMockMode()) {
    return getMockWooCategories()
  }

  return wooFetch<WooCategory[]>({
    path: '/products/categories',
    params: {
      per_page: 100,
      hide_empty: true,
      orderby: 'name',
      order: 'asc',
    },
    tags: ['woo-categories'],
    revalidate: 3600,
  })
}

export async function getWooCategoryBySlug(slug: string): Promise<WooCategory | null> {
  if (isWooMockMode()) {
    return getMockWooCategories().find((c) => c.slug === slug) ?? null
  }

  const categories = await wooFetch<WooCategory[]>({
    path: '/products/categories',
    params: { slug, per_page: 1 },
    tags: [`woo-category-${slug}`],
    revalidate: 3600,
  })

  return categories[0] ?? null
}