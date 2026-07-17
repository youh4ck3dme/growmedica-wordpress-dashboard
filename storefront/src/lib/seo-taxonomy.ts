import taxonomy from '../../../reports/seo-taxonomy/growmedica-seo-menu-tree.json'
import type { CollectionListOptions, CollectionView, NavCollectionItem } from '@/lib/catalog/nav-types'
import type { ProductListItem } from '@/lib/shopify/types'
import { getWooCategories } from '@/lib/wordpress/categories'
import { getWooProducts } from '@/lib/wordpress/products'
import type { WooCategory } from '@/lib/wordpress/types'

export type FrozenCategory = (typeof taxonomy.categories)[number]

const categories = taxonomy.categories as FrozenCategory[]
const byId = new Map(categories.map((category) => [category.categoryId, category]))
const bySkPath = new Map(categories.map((category) => [category.localizedPaths.sk, category]))

function normalizedName(value: string): string {
  return value.trim().toLocaleLowerCase('sk')
}

export function getFrozenCategoryByPath(path: string): FrozenCategory | null {
  return bySkPath.get(path.replace(/^\/+|\/+$/g, '')) ?? null
}

export function getFrozenCategoryAncestors(category: FrozenCategory): FrozenCategory[] {
  const ancestors: FrozenCategory[] = []
  let cursor = category.parentId ? byId.get(category.parentId) : undefined
  while (cursor) {
    ancestors.unshift(cursor)
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }
  return ancestors
}

export function getFrozenCategorySeo(categoryId: string) {
  return taxonomy.categorySeo.find((entry) => entry.categoryId === categoryId && entry.locale === 'sk') ?? null
}

export function getIndexableSeoTaxonomyPaths(): string[] {
  return categories
    .filter((category) => category.indexRecommendation === 'INDEX CANDIDATE')
    .map((category) => category.localizedPaths?.sk)
    .filter((path): path is string => typeof path === 'string' && path.length > 0)
}

async function buildWooCategoryMap(): Promise<Map<string, WooCategory>> {
  const wooCategories = await getWooCategories()
  const wooByParentAndName = new Map(
    wooCategories.map((category) => [
      `${category.parent || 0}:${normalizedName(category.name)}`,
      category,
    ]),
  )
  const mapped = new Map<string, WooCategory>()

  for (const category of [...categories].sort((a, b) => a.depth - b.depth)) {
    const parentWooId = category.parentId ? mapped.get(category.parentId)?.id : 0
    if (category.parentId && !parentWooId) continue
    const wooCategory = wooByParentAndName.get(
      `${parentWooId || 0}:${normalizedName(category.labels.sk)}`,
    )
    if (wooCategory) mapped.set(category.categoryId, wooCategory)
  }
  return mapped
}

function descendantCount(categoryId: string, wooMap: Map<string, WooCategory>): number {
  let total = wooMap.get(categoryId)?.count ?? 0
  for (const child of categories.filter((category) => category.parentId === categoryId)) {
    total += descendantCount(child.categoryId, wooMap)
  }
  return total
}

export async function getSeoTaxonomyNavItems(): Promise<NavCollectionItem[]> {
  const wooMap = await buildWooCategoryMap()
  return categories
    .filter((category) => category.menuVisibility === 'global_l1_l2')
    .map((category) => ({ category, count: descendantCount(category.categoryId, wooMap) }))
    .filter(({ count }) => count > 0)
    .map(({ category, count }) => ({
      handle: category.localizedPaths.sk,
      title: category.labels.sk,
      description: getFrozenCategorySeo(category.categoryId)?.metaDescription ?? null,
      href: `/kategorie/${category.localizedPaths.sk}`,
      productCount: count,
      menuLabel: category.labels.sk.toLocaleUpperCase('sk'),
      source: 'catalog' as const,
    }))
}

function applyFilters(
  products: ProductListItem[],
  options: Pick<CollectionListOptions, 'vendor' | 'inStockOnly'>,
): ProductListItem[] {
  return products.filter((product) => {
    if (options.vendor && product.vendor !== options.vendor) return false
    if (options.inStockOnly && !product.availableForSale) return false
    return true
  })
}

export async function getSeoTaxonomyCollectionView(
  path: string,
  options: CollectionListOptions = {},
): Promise<CollectionView | null> {
  const category = getFrozenCategoryByPath(path)
  if (!category) return null
  const page = Math.max(1, options.page ?? 1)
  const wooCategory = (await buildWooCategoryMap()).get(category.categoryId)
  const seo = getFrozenCategorySeo(category.categoryId)

  if (!wooCategory) {
    return {
      handle: category.localizedPaths.sk,
      title: category.labels.sk,
      description: seo?.metaDescription ?? null,
      products: [],
      availableVendors: [],
      source: 'catalog',
      page,
      hasNextPage: false,
      hasPreviousPage: false,
      totalOnPage: 0,
    }
  }

  const orderby = options.sort === 'title' ? 'title' : options.sort?.startsWith('price') ? 'price' : 'popularity'
  const order = options.sort === 'price-asc' || options.sort === 'title' ? 'asc' : 'desc'
  // Use Woo term ID — not slug — (WP auto-suffixes duplicate term slugs).
  const categoryKey = String(wooCategory.id)
  const result = await getWooProducts({ page, perPage: 24, category: categoryKey, orderby, order })
  const vendorSample = await getWooProducts({ page: 1, perPage: 50, category: categoryKey })
  const availableVendors = [...new Set(vendorSample.edges.map(({ node }) => node.vendor).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'sk'))
  const products = applyFilters(result.edges.map(({ node }) => node), options)

  return {
    handle: category.localizedPaths.sk,
    title: category.labels.sk,
    description: seo?.metaDescription ?? null,
    products,
    availableVendors,
    source: 'catalog',
    page,
    hasNextPage: result.pageInfo.hasNextPage,
    hasPreviousPage: page > 1,
    totalOnPage: products.length,
  }
}

export async function getSeoTaxonomyFeaturedProducts(path: string, count = 3): Promise<ProductListItem[]> {
  const category = getFrozenCategoryByPath(path)
  if (!category) return []
  const wooCategory = (await buildWooCategoryMap()).get(category.categoryId)
  if (!wooCategory) return []
  const result = await getWooProducts({ page: 1, perPage: count, category: String(wooCategory.id) })
  return result.edges.map(({ node }) => node).slice(0, count)
}
