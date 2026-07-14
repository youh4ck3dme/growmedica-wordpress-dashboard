import { isWordPressCms } from '@/lib/cms'
import type { Collection } from '@/lib/shopify/types'
import {
  getCollections as getShopifyCollections,
  getCollectionByHandle as getShopifyCollectionByHandle,
} from '@/lib/shopify/collections'
import { getWooCategories, getWooCategoryBySlug } from '@/lib/wordpress/categories'
import { isWooMockMode, getMockWooCategories } from '@/lib/wordpress/mock'
import type { WooCategory } from '@/lib/wordpress/types'

function wooCategoryToCollection(category: WooCategory): Collection {
  return {
    id: String(category.id),
    handle: category.slug,
    title: category.name,
    description: category.description,
    descriptionHtml: category.description,
    image: null,
    seo: { title: category.name, description: category.description || null },
    updatedAt: new Date().toISOString(),
  }
}

export async function getCollections(count = 50): Promise<Collection[]> {
  if (isWordPressCms()) {
    const categories = isWooMockMode() ? getMockWooCategories() : await getWooCategories()
    return categories.slice(0, count).map(wooCategoryToCollection)
  }
  const nodes = await getShopifyCollections(count)
  return nodes as Collection[]
}

export async function getCollectionByHandle(handle: string, productCount?: number, after?: string) {
  if (isWordPressCms()) {
    const category = isWooMockMode()
      ? getMockWooCategories().find((c) => c.slug === handle) ?? null
      : await getWooCategoryBySlug(handle)
    if (!category) return null
    return {
      ...wooCategoryToCollection(category),
      products: { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null } },
    }
  }
  return getShopifyCollectionByHandle(handle, productCount, after)
}
