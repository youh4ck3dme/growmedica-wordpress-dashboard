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
  const withProducts = collections.filter((c) => c.productCount > 0)

  return Promise.all(
    withProducts.map(async (cat) => ({
      ...cat,
      featuredProducts: await getCategoryFeaturedProducts(cat.handle, featuredCount),
    })),
  )
}
