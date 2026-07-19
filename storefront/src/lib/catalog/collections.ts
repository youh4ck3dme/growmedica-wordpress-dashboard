import type { Collection } from '@/lib/catalog/types'
import { decodeHtmlEntities } from '@/lib/utils'
import { getWooCategories, getWooCategoryBySlug } from '@/lib/wordpress/categories'
import { isWooMockMode, getMockWooCategories } from '@/lib/wordpress/mock'
import type { WooCategory } from '@/lib/wordpress/types'

function wooCategoryToCollection(category: WooCategory): Collection {
  const title = decodeHtmlEntities(category.name)
  return {
    id: String(category.id),
    handle: category.slug,
    title,
    description: category.description,
    descriptionHtml: category.description,
    image: null,
    seo: { title, description: category.description || null },
    updatedAt: new Date().toISOString(),
  }
}

export async function getCollections(count = 50): Promise<Collection[]> {
  const categories = isWooMockMode() ? getMockWooCategories() : await getWooCategories()
  return categories.slice(0, count).map(wooCategoryToCollection)
}

export async function getCollectionByHandle(handle: string, _productCount?: number, _after?: string) {
  const category = isWooMockMode()
    ? getMockWooCategories().find((c) => c.slug === handle) ?? null
    : await getWooCategoryBySlug(handle)
  if (!category) return null
  return {
    ...wooCategoryToCollection(category),
    products: {
      edges: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    },
  }
}
