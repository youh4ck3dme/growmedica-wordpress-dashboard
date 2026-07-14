/**
 * Main product categories — single source of truth for navigation and listings.
 * Maps Shopify productType + tags (from export) to stable SEO-friendly slugs.
 */

/** Shopify system collections hidden from storefront navigation */
export const HIDDEN_COLLECTION_HANDLES = new Set(['frontpage', 'all'])

export type MainCategory =
  | 'sportova-vyziva'
  | 'regeneracia'
  | 'zdrave-potraviny'
  | 'vitaminy-mineraly'
  | 'klby-pohyb'
  | 'imunita'
  | 'travenie'
  | 'srdce-cievy'
  | 'spanok-stres'
  | 'krasa-pokozka'
  | 'detox-pecen'
  | 'proteiny'
  | 'aminokyseliny'
  | 'specialna-vyziva'
  | 'ostatne'

export type CategoryRule = {
  kind: 'productType' | 'tag'
  value: string
  match?: 'exact' | 'ci'
}

export interface CategoryDefinition {
  slug: MainCategory
  title: string
  menuLabel: string
  description?: string
  icon?: string
  navPriority: number
  showInHeader: boolean
  rules: CategoryRule[]
}

export interface ProductCategoryInput {
  productType: string
  tags: string[]
}

/** Old /kolekcie slugs → new category slugs (301 in next.config) */
export const LEGACY_SLUG_REDIRECTS: Record<string, MainCategory> = {
  'doplnky-vyzivy': 'vitaminy-mineraly',
  'mykologicke-produkty': 'specialna-vyziva',
  'zdravotne-riesenia': 'specialna-vyziva',
  'zdravie': 'specialna-vyziva',
  'kozmetika': 'krasa-pokozka',
  'pre-zvierata': 'specialna-vyziva',
}

const RESOLVE_ORDER: CategoryDefinition[] = [
  {
    slug: 'proteiny',
    title: 'Proteíny',
    menuLabel: 'PROTEÍNY',
    icon: '💪',
    navPriority: 13,
    showInHeader: false,
    description: 'Proteínové doplnky na podporu rastu a udržania svalovej hmoty.',
    rules: [
      { kind: 'productType', value: 'Proteíny' },
      { kind: 'tag', value: 'Proteíny', match: 'ci' },
      { kind: 'tag', value: 'proteiny', match: 'ci' },
    ],
  },
  {
    slug: 'aminokyseliny',
    title: 'Aminokyseliny',
    menuLabel: 'AMINOKYSELINY',
    icon: '⚡',
    navPriority: 14,
    showInHeader: false,
    description: 'Esenciálne aminokyseliny a BCAA pre výkon, regeneráciu a svalovú výživu.',
    rules: [{ kind: 'tag', value: 'Aminokyseliny', match: 'ci' }],
  },
  {
    slug: 'sportova-vyziva',
    title: 'Športová výživa',
    menuLabel: 'ŠPORTOVÁ VÝŽIVA',
    icon: '🏃',
    navPriority: 1,
    showInHeader: true,
    description: 'Doplnky pre športovcov a aktívny životný štýl.',
    rules: [
      { kind: 'productType', value: 'ŠPORTOVÁ VÝŽIVA' },
      { kind: 'productType', value: 'Šport' },
      { kind: 'tag', value: 'ŠPORTOVÁ VÝŽIVA', match: 'ci' },
      { kind: 'tag', value: 'šport', match: 'ci' },
    ],
  },
  {
    slug: 'regeneracia',
    title: 'Regeneračné doplnky',
    menuLabel: 'REGENERÁCIA',
    icon: '🔄',
    navPriority: 2,
    showInHeader: true,
    description: 'Podpora regenerácie po záťaži a športe.',
    rules: [
      { kind: 'productType', value: 'Regeneračné doplnky' },
      { kind: 'tag', value: 'Regeneračné doplnky', match: 'ci' },
    ],
  },
  {
    slug: 'zdrave-potraviny',
    title: 'Zdravé potraviny',
    menuLabel: 'ZDRAVÉ POTRAVINY',
    icon: '🥗',
    navPriority: 3,
    showInHeader: true,
    description: 'Prírodné potraviny a superpotraviny pre každodennú stravu.',
    rules: [
      { kind: 'productType', value: 'Zdravé potraviny' },
      { kind: 'tag', value: 'Zdravé potraviny', match: 'ci' },
    ],
  },
  {
    slug: 'klby-pohyb',
    title: 'Kĺby a pohyb',
    menuLabel: 'KĹBY A POHYB',
    icon: '🦴',
    navPriority: 5,
    showInHeader: false,
    description: 'Výživa pre kĺby, šľachy a pohybový aparát pre aktívny život bez obmedzení.',
    rules: [
      { kind: 'tag', value: 'kĺby a svaly', match: 'ci' },
      { kind: 'tag', value: 'Kĺby', match: 'ci' },
      { kind: 'productType', value: 'Pohyb' },
    ],
  },
  {
    slug: 'imunita',
    title: 'Imunita',
    menuLabel: 'IMUNITA',
    icon: '🛡️',
    navPriority: 6,
    showInHeader: true,
    description: 'Vitamíny, minerály a prírodné doplnky na podporu obranyschopnosti.',
    rules: [
      { kind: 'tag', value: 'Imunita', match: 'ci' },
      { kind: 'productType', value: 'Imunita' },
    ],
  },
  {
    slug: 'travenie',
    title: 'Trávenie',
    menuLabel: 'TRÁVENIE',
    icon: '🫄',
    navPriority: 7,
    showInHeader: true,
    description: 'Podpora trávenia, črevnej rovnováhy a komfortu po jedle.',
    rules: [{ kind: 'tag', value: 'Trávenie', match: 'ci' }],
  },
  {
    slug: 'srdce-cievy',
    title: 'Srdce a cievy',
    menuLabel: 'SRDCE A CIEVY',
    icon: '❤️',
    navPriority: 8,
    showInHeader: false,
    description: 'Doplnky na podporu srdca, ciev a zdravého krvného obehu.',
    rules: [
      { kind: 'tag', value: 'Srdce a Pečeň', match: 'ci' },
      { kind: 'tag', value: 'Srdce', match: 'ci' },
    ],
  },
  {
    slug: 'spanok-stres',
    title: 'Spánok a stres',
    menuLabel: 'SPÁNOK A STRES',
    icon: '😴',
    navPriority: 9,
    showInHeader: false,
    description: 'Prírodná podpora spánku, psychickej pohody a zvládania stresu.',
    rules: [
      { kind: 'productType', value: 'Stres / Spánok / Nervy' },
      { kind: 'productType', value: 'Psychická pohoda' },
      { kind: 'tag', value: 'Spánok', match: 'ci' },
      { kind: 'tag', value: 'Stres', match: 'ci' },
    ],
  },
  {
    slug: 'detox-pecen',
    title: 'Detox a pečeň',
    menuLabel: 'DETOX A PEČEŇ',
    icon: '🧹',
    navPriority: 10,
    showInHeader: false,
    description: 'Prípravky na podporu pečene, detoxikácie a prirodzeného čistenia organizmu.',
    rules: [
      { kind: 'tag', value: 'Detox', match: 'ci' },
      { kind: 'tag', value: 'Pečeň', match: 'ci' },
      { kind: 'productType', value: 'Detoxikácia' },
    ],
  },
  {
    slug: 'krasa-pokozka',
    title: 'Krása a pokožka',
    menuLabel: 'KRÁSA A POKOŽKA',
    icon: '✨',
    navPriority: 4,
    showInHeader: true,
    description: 'Prírodná kozmetika a starostlivosť o pokožku.',
    rules: [
      { kind: 'productType', value: 'KOZMETIKA' },
      { kind: 'productType', value: 'Detská kozmetika' },
      { kind: 'productType', value: 'Pokožka' },
      { kind: 'tag', value: 'KOZMETIKA', match: 'ci' },
      { kind: 'tag', value: 'Krása', match: 'ci' },
    ],
  },
  {
    slug: 'vitaminy-mineraly',
    title: 'Vitamíny a minerály',
    menuLabel: 'VITAMÍNY A MINERÁLY',
    icon: '🌿',
    navPriority: 11,
    showInHeader: true,
    description: 'Doplnky výživy, vitamíny a minerály pre každodennú starostlivosť.',
    rules: [
      { kind: 'tag', value: 'Vitamíny', match: 'ci' },
      { kind: 'tag', value: 'Minerály', match: 'ci' },
      { kind: 'productType', value: 'Doplnky výživy pre Deti' },
      { kind: 'productType', value: 'DOPLNKY VÝŽIVY' },
      { kind: 'tag', value: 'DOPLNKY VÝŽIVY', match: 'ci' },
    ],
  },
  {
    slug: 'specialna-vyziva',
    title: 'Špeciálna výživa',
    menuLabel: 'ŠPECIÁLNA VÝŽIVA',
    icon: '💊',
    navPriority: 12,
    showInHeader: true,
    description: 'Prírodné prípravky, mykologické produkty a zdravotné riešenia.',
    rules: [
      { kind: 'productType', value: 'Prírodné prípravky' },
      { kind: 'productType', value: 'Bioinformačné prípravky' },
      { kind: 'productType', value: 'BALÍČKY ZDRAVIA' },
      { kind: 'productType', value: 'PRE ZVIERATÁ' },
      { kind: 'tag', value: 'ZDRAVOTNÉ RIEŠENIA', match: 'ci' },
      { kind: 'tag', value: 'MYKOLOGICKÉ PRODUKTY', match: 'ci' },
      { kind: 'tag', value: 'Mykologické prípravky', match: 'ci' },
    ],
  },
]

export const OSTATNE_CATEGORY: CategoryDefinition = {
  slug: 'ostatne',
  title: 'Ostatné',
  menuLabel: 'OSTATNÉ',
  navPriority: 99,
  showInHeader: false,
  rules: [],
}

export const MAIN_CATEGORIES: CategoryDefinition[] = [...RESOLVE_ORDER, OSTATNE_CATEGORY]

const CATEGORY_BY_SLUG = new Map(MAIN_CATEGORIES.map((c) => [c.slug, c]))

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function ruleMatches(product: ProductCategoryInput, rule: CategoryRule): boolean {
  if (rule.kind === 'productType') {
    return product.productType === rule.value
  }
  const tags = product.tags.map(normalizeTag)
  const needle = normalizeTag(rule.value)
  return tags.includes(needle)
}

export function resolveCategory(product: ProductCategoryInput): MainCategory {
  for (const def of RESOLVE_ORDER) {
    if (def.rules.some((rule) => ruleMatches(product, rule))) {
      return def.slug
    }
  }
  return 'ostatne'
}

export function getCategoryDefinition(slug: MainCategory): CategoryDefinition {
  return CATEGORY_BY_SLUG.get(slug) ?? OSTATNE_CATEGORY
}

export function normalizeCategorySlug(handle: string): MainCategory | null {
  const legacy = LEGACY_SLUG_REDIRECTS[handle]
  if (legacy) return legacy
  if (CATEGORY_BY_SLUG.has(handle as MainCategory)) {
    return handle as MainCategory
  }
  return null
}

function escapeSearchValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function ruleToSearchFragment(rule: CategoryRule): string {
  const escaped = escapeSearchValue(rule.value)
  if (rule.kind === 'productType') {
    return `product_type:'${escaped}'`
  }
  return `tag:'${escaped}'`
}

export function buildCategorySearchQuery(slug: MainCategory): string | null {
  const def = getCategoryDefinition(slug)
  if (slug === 'ostatne' || def.rules.length === 0) {
    return null
  }
  const fragments = def.rules.map(ruleToSearchFragment)
  return fragments.length === 1 ? fragments[0]! : `(${fragments.join(' OR ')})`
}

export function getHeaderCategories(): CategoryDefinition[] {
  return RESOLVE_ORDER.filter((c) => c.showInHeader).sort(
    (a, b) => a.navPriority - b.navPriority
  )
}

export function getHomepageCategories(): CategoryDefinition[] {
  return RESOLVE_ORDER.filter((c) => c.showInHeader)
    .sort((a, b) => a.navPriority - b.navPriority)
    .slice(0, 8)
}

export function getNavCategories(): CategoryDefinition[] {
  return RESOLVE_ORDER.filter((c) => c.slug !== 'ostatne')
}

export function getLegacyRedirectEntries(): Array<{ source: string; destination: string }> {
  return Object.entries(LEGACY_SLUG_REDIRECTS).map(([oldSlug, newSlug]) => ({
    source: `/kolekcie/${oldSlug}`,
    destination: `/kolekcie/${newSlug}`,
  }))
}
