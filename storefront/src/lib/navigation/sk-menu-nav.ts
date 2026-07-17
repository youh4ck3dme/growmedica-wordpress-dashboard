/**
 * Navigation tree mirrored from growmedica.sk main menu (#nav).
 * Used for header mega menu + mobile category list on the live Woo storefront.
 */

import skMenu from '@/lib/navigation/growmedica-sk-menu.json'
import type { NavCollectionItem } from '@/lib/catalog/nav-types'
import { getWooCategories } from '@/lib/wordpress/categories'
import type { WooCategory } from '@/lib/wordpress/types'

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

function toItem(
  node: SkMenuNode,
  productCount: number,
  children: NavCollectionItem[],
): NavCollectionItem {
  const path = node.path.replace(/^\/+|\/+$/g, '')
  return {
    handle: path,
    title: node.label,
    description: null,
    href: `/kategorie/${path}`,
    productCount,
    menuLabel: node.label.toLocaleUpperCase('sk'),
    source: 'catalog',
    children: children.length > 0 ? children : undefined,
  }
}

async function buildWooNameCountMap(): Promise<Map<string, number>> {
  let woo: WooCategory[] = []
  try {
    woo = await getWooCategories()
  } catch {
    woo = []
  }
  const byName = new Map<string, number>()
  for (const cat of woo) {
    const key = normalizedName(cat.name)
    byName.set(key, (byName.get(key) ?? 0) + (cat.count ?? 0))
  }
  return byName
}

function nodeCount(node: SkMenuNode, byName: Map<string, number>): number {
  const own = byName.get(normalizedName(node.label)) ?? 0
  const childSum = node.children.reduce((sum, child) => sum + nodeCount(child, byName), 0)
  // Prefer subtree sum when children exist; otherwise own count.
  return node.children.length > 0 ? Math.max(own, childSum) : own
}

function mapNode(node: SkMenuNode, byName: Map<string, number>): NavCollectionItem {
  const children = node.children.map((child) => mapNode(child, byName))
  const count = nodeCount(node, byName)
  return toItem(node, count, children)
}

/** Top-level SK menu categories (7) with nested children — like growmedica.sk. */
export async function getSkMenuNavItems(): Promise<NavCollectionItem[]> {
  const byName = await buildWooNameCountMap()
  return ROOT_ITEMS.map((node) => mapNode(node, byName))
}

/** Flat list of every node in the SK tree (for sitemap / full mobile expand). */
export async function getSkMenuNavItemsFlat(): Promise<NavCollectionItem[]> {
  const tree = await getSkMenuNavItems()
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
