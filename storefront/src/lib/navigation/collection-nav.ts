/**
 * @deprecated Import from @/lib/category-map instead.
 * Re-exports for backward compatibility.
 */

import {
  getCategoryDefinition,
  getNavCategories,
  normalizeCategorySlug,
  buildCategorySearchQuery,
  type MainCategory,
  type CategoryRule,
  type CategoryDefinition,
  type ProductCategoryInput,
  LEGACY_SLUG_REDIRECTS,
  MAIN_CATEGORIES,
  OSTATNE_CATEGORY,
  resolveCategory,
  getHeaderCategories,
  getHomepageCategories,
  getLegacyRedirectEntries,
} from '@/lib/category-map'

export {
  type MainCategory,
  type CategoryRule,
  type CategoryDefinition,
  type ProductCategoryInput,
  LEGACY_SLUG_REDIRECTS,
  MAIN_CATEGORIES,
  OSTATNE_CATEGORY,
  resolveCategory,
  getCategoryDefinition,
  normalizeCategorySlug,
  buildCategorySearchQuery,
  getHeaderCategories,
  getHomepageCategories,
  getNavCategories,
  getLegacyRedirectEntries,
}

/** @deprecated Use MainCategory slug filters */
export type CollectionFilter = {
  kind: 'productType' | 'tag'
  value: string
}

/** @deprecated Use CategoryDefinition */
export type NavCollectionDefinition = CategoryDefinition

export { HIDDEN_COLLECTION_HANDLES } from '@/lib/category-map'

/** @deprecated Use getNavCategories */
export const NAV_COLLECTION_DEFINITIONS = getNavCategories().map((c) => ({
  handle: c.slug,
  title: c.title,
  menuLabel: c.menuLabel,
  description: c.description,
  icon: c.icon,
  filter: c.rules[0]
    ? { kind: c.rules[0].kind, value: c.rules[0].value }
    : { kind: 'tag' as const, value: '' },
}))

/** @deprecated Use getCategoryDefinition */
export function getNavDefinitionByHandle(handle: string) {
  const slug = normalizeCategorySlug(handle)
  if (!slug) return undefined
  const def = getCategoryDefinition(slug)
  return {
    handle: def.slug,
    title: def.title,
    menuLabel: def.menuLabel,
    description: def.description,
    icon: def.icon,
    filter: def.rules[0]
      ? { kind: def.rules[0].kind, value: def.rules[0].value }
      : { kind: 'tag' as const, value: '' },
  }
}

/** @deprecated Use buildCategorySearchQuery */
export function buildProductSearchQuery(filter: CollectionFilter): string {
  const escaped = filter.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  if (filter.kind === 'productType') {
    return `product_type:'${escaped}'`
  }
  return `tag:'${escaped}'`
}
