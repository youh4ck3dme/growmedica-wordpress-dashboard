import {
  getWooNavCollectionItems,
  getWooCollectionViewByHandle,
  getWooCategoryFeaturedProducts,
} from '@/lib/wordpress/collection-nav'
import { shouldIncludeMegaMenuCollection } from './nav-types'
import type { Locale } from '@/lib/i18n/types'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

export type { NavCollectionItem, CollectionView, CollectionListOptions } from './nav-types'

export async function getNavCollectionItems(locale: Locale = DEFAULT_LOCALE) {
  return getWooNavCollectionItems(locale)
}

export async function getCollectionViewByHandle(
  handle: string,
  options?: import('./nav-types').CollectionListOptions,
) {
  return getWooCollectionViewByHandle(handle, options)
}

export async function getCategoryFeaturedProducts(handle: string, count = 3) {
  return getWooCategoryFeaturedProducts(handle, count)
}

/** One-shot mega-menu payload — avoids N sequential featured fetches in HeaderShell. */
export async function getMegaMenuCategories(
  featuredCount = 3,
  locale: Locale = DEFAULT_LOCALE,
) {
  const collections = await getNavCollectionItems(locale)
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
