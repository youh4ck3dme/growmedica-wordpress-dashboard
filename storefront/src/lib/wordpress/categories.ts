import { cache } from 'react'
import { wooFetchPaginated } from './client'
import { isWooMockMode, getMockWooCategories } from './mock'
import type { WooCategory } from './types'

/** Request-scoped cache — mega-menu featured fetches share one categories list. */
export const getWooCategories = cache(async (): Promise<WooCategory[]> => {
  if (isWooMockMode()) {
    return getMockWooCategories()
  }

  const all: WooCategory[] = []
  let page = 1
  let totalPages = 1

  do {
    const result = await wooFetchPaginated<WooCategory>({
      path: '/products/categories',
      params: {
        page,
        per_page: 100,
        hide_empty: false,
        orderby: 'name',
        order: 'asc',
      },
      tags: ['woo-categories'],
      revalidate: 3600,
    })
    all.push(...result.items)
    totalPages = Math.max(1, result.totalPages)
    page += 1
  } while (page <= totalPages)

  return all
})

export async function getWooCategoryBySlug(slug: string): Promise<WooCategory | null> {
  const categories = await getWooCategories()
  const leaf = slug.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop() ?? slug
  return (
    categories.find((c) => c.slug === slug) ??
    categories.find((c) => c.slug === leaf) ??
    null
  )
}
