import { isWordPressCms } from '@/lib/cms'
import {
  getNavCollectionItems as getShopifyNavItems,
  getCollectionViewByHandle as getShopifyCollectionView,
  getCategoryFeaturedProducts as getShopifyCategoryFeatured,
} from '@/lib/shopify/collection-nav'
import {
  getWooNavCollectionItems,
  getWooCollectionViewByHandle,
  getWooCategoryFeaturedProducts,
} from '@/lib/wordpress/collection-nav'
import { shouldIncludeMegaMenuCollection } from './nav-types'

export type { NavCollectionItem, CollectionView, CollectionListOptions } from './nav-types'

export async function getNavCollectionItems() {
  if (isWordPressCms()) {
    return getWooNavCollectionItems()
  }
  return getShopifyNavItems()
}

export async function getCollectionViewByHandle(
  handle: string,
  options?: import('./nav-types').CollectionListOptions,
) {
  if (isWordPressCms()) {
    return getWooCollectionViewByHandle(handle, options)
  }
  return getShopifyCollectionView(handle, options)
}

export async function getCategoryFeaturedProducts(handle: string, count = 3) {
  if (isWordPressCms()) {
    return getWooCategoryFeaturedProducts(handle, count)
  }
  return getShopifyCategoryFeatured(handle, count)
}

/** One-shot mega-menu payload — avoids N sequential featured fetches in HeaderShell. */
export async function getMegaMenuCategories(featuredCount = 3) {
  const collections = await getNavCollectionItems()
  // Keep full SK tree tops even when productCount is 0 (parity with growmedica.sk).
  // Still skip empty leaf-only nodes that have no children and no products.
  const forMenu = collections.filter(shouldIncludeMegaMenuCollection)

  return Promise.all(
    forMenu.map(async (cat) => ({
      ...cat,
      featuredProducts: await getCategoryFeaturedProducts(cat.handle, featuredCount),
    })),
  )
}
