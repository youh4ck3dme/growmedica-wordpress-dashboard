/**
 * Navigation tree mirrored from growmedica.sk main menu (#nav).
 * Used for header mega menu + mobile category list on the live Woo storefront.
 */

import skMenu from '@/lib/navigation/growmedica-sk-menu.json'
import type { NavCollectionItem } from '@/lib/catalog/nav-types'
import { getWooCategories } from '@/lib/wordpress/categories'
import type { WooCategory } from '@/lib/wordpress/types'
import type { Locale } from '@/lib/i18n/types'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { getFrozenCategoryLabelByPath } from '@/lib/seo-taxonomy'

// Ensure JSON import is treated as module data (paths / labels only — no secrets).

export type SkMenuNode = {
  label: string
  path: string
  skPath?: string
  children: SkMenuNode[]
}

const ROOT_ITEMS = skMenu.items as SkMenuNode[]

function normalizedName(value: string): string {
  return value.trim().toLocaleLowerCase('sk')
}

function leafSlug(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '')
  const parts = clean.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? clean
}

function resolveNodeLabel(node: SkMenuNode, locale: Locale): string {
  const path = node.path.replace(/^\/+|\/+$/g, '')
  return getFrozenCategoryLabelByPath(path, locale, node.label)
}

function toItem(
  node: SkMenuNode,
  productCount: number,
  children: NavCollectionItem[],
  imageUrl: string | null | undefined,
  locale: Locale,
): NavCollectionItem {
  const path = node.path.replace(/^\/+|\/+$/g, '')
  const title = resolveNodeLabel(node, locale)
  const upperLocale = locale === 'en' ? 'en' : locale
  return {
    handle: path,
    title,
    description: null,
    href: `/kategorie/${path}`,
    productCount,
    menuLabel: title.toLocaleUpperCase(upperLocale),
    source: 'catalog',
    imageUrl: imageUrl ?? null,
    children: children.length > 0 ? children : undefined,
  }
}

type WooNavIndex = {
  byName: Map<string, number>
  imageBySlug: Map<string, string>
  imageByName: Map<string, string>
}

async function buildWooNavIndex(): Promise<WooNavIndex> {
  let woo: WooCategory[] = []
  try {
    woo = await getWooCategories()
  } catch {
    woo = []
  }
  const byName = new Map<string, number>()
  const imageBySlug = new Map<string, string>()
  const imageByName = new Map<string, string>()
  for (const cat of woo) {
    const key = normalizedName(cat.name)
    byName.set(key, (byName.get(key) ?? 0) + (cat.count ?? 0))
    const src = cat.image?.src
    if (src) {
      imageBySlug.set(cat.slug, src)
      imageByName.set(key, src)
    }
  }
  return { byName, imageBySlug, imageByName }
}

function nodeCount(node: SkMenuNode, byName: Map<string, number>): number {
  const own = byName.get(normalizedName(node.label)) ?? 0
  const childSum = node.children.reduce((sum, child) => sum + nodeCount(child, byName), 0)
  // Prefer subtree sum when children exist; otherwise own count.
  return node.children.length > 0 ? Math.max(own, childSum) : own
}

function resolveNodeImage(node: SkMenuNode, index: WooNavIndex): string | null {
  const path = node.path.replace(/^\/+|\/+$/g, '')
  return (
    index.imageBySlug.get(path) ??
    index.imageBySlug.get(leafSlug(path)) ??
    index.imageByName.get(normalizedName(node.label)) ??
    null
  )
}

function mapNode(node: SkMenuNode, index: WooNavIndex, locale: Locale): NavCollectionItem {
  const children = node.children.map((child) => mapNode(child, index, locale))
  const count = nodeCount(node, index.byName)
  return toItem(node, count, children, resolveNodeImage(node, index), locale)
}

/** Top-level menu categories with nested children — labels follow UI locale. */
export async function getSkMenuNavItems(
  locale: Locale = DEFAULT_LOCALE,
): Promise<NavCollectionItem[]> {
  const index = await buildWooNavIndex()
  return ROOT_ITEMS.map((node) => mapNode(node, index, locale))
}

/** Flat list of every node in the menu tree (for sitemap / full mobile expand). */
export async function getSkMenuNavItemsFlat(
  locale: Locale = DEFAULT_LOCALE,
): Promise<NavCollectionItem[]> {
  const tree = await getSkMenuNavItems(locale)
  const out: NavCollectionItem[] = []
  const walk = (items: NavCollectionItem[]) => {
    for (const item of items) {
      out.push({ ...item, children: undefined })
      if (item.children?.length) walk(item.children)
    }
  }
  walk(tree)
  return out
}

export function getSkMenuRootLabels(): string[] {
  return ROOT_ITEMS.map((item) => item.label)
}

/** Resolve SK slug typos / legacy paths to freeze paths (if aliased). */
export function resolveSkMenuPath(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '')
  const aliases = (skMenu as { pathAliases?: Record<string, string> }).pathAliases ?? {}
  return aliases[clean] ?? clean
}
