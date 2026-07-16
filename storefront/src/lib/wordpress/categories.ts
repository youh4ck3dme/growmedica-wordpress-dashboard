import { cache } from 'react'
import { wooFetch } from './client'
import { isWooMockMode, getMockWooCategories } from './mock'
import type { WooCategory } from './types'

/** Request-scoped cache — mega-menu featured fetches share one categories list. */
export const getWooCategories = cache(async (): Promise<WooCategory[]> => {
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
})

export async function getWooCategoryBySlug(slug: string): Promise<WooCategory | null> {
  const categories = await getWooCategories()
  return categories.find((c) => c.slug === slug) ?? null
}
