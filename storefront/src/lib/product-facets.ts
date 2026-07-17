/**
 * Controlled storefront facets derived from noisy WooCommerce catalog data.
 *
 * Woo tags contain a mix of effects, brands, SKUs, EANs, package sizes and SEO
 * phrases. Only exact aliases declared here may appear in the effect facet.
 */

interface ProductEffectDefinition {
  label: string
  aliases: readonly string[]
}

export const PRODUCT_EFFECT_TAXONOMY = [
  {
    label: 'Imunita',
    aliases: [
      'aktivácia imunity',
      'imunita',
      'obranyschopnosť',
      'obranyschopnosť organizmu',
      'ochrana imunitného systému',
      'podpora imunity',
      'posilnenie imunity',
      'zlepšenie imunity',
    ],
  },
  {
    label: 'Detoxikácia',
    aliases: [
      'detox',
      'detoxikácia',
      'očista organizmu',
      'očista tela',
      'prečistenie organizmu',
      'odstránenie toxínov',
      'odvedenie toxínov',
      'zbavenie toxínov',
    ],
  },
  {
    label: 'Spánok a relax',
    aliases: [
      'nespavosť',
      'podpora spánku',
      'relaxácia',
      'spánok',
      'upokojenie',
      'upokojenie mysle',
      'zaspávanie',
    ],
  },
  {
    label: 'Energia a vitalita',
    aliases: [
      'energia',
      'podpora vitality',
      'prebudenie energie',
      'únava',
      'vitalita',
      'zlepšenie vitality',
      'zvýšenie energie',
    ],
  },
  {
    label: 'Trávenie',
    aliases: [
      'nadúvanie',
      'podpora trávenia',
      'trávenie',
      'tráviace problémy',
      'tráviace ťažkosti',
      'zdravé trávenie',
      'žalúdok',
      'žalúdočné problémy',
    ],
  },
  {
    label: 'Črevá a mikroflóra',
    aliases: [
      'črevá',
      'črevná mikroflóra',
      'črevné problémy',
      'prebiotiká',
      'probiotiká',
      'probiotiká pre trávenie',
    ],
  },
  {
    label: 'Kĺby a svaly',
    aliases: [
      'kĺby',
      'kĺby a svaly',
      'ochrana kĺbov',
      'pohybový aparát',
      'podpora kĺbov',
      'podpora svalov',
      'regenerácia kĺbov',
      'regenerácia svalov',
      'svaly',
    ],
  },
  {
    label: 'Kosti a zuby',
    aliases: [
      'kosti',
      'ochrana kostí',
      'pevnosť kostí a svalov',
      'podpora kostí',
      'zdravé kosti',
      'zuby',
    ],
  },
  {
    label: 'Srdce a cievy',
    aliases: [
      'cievy',
      'harmonizácia srdca',
      'ochrana srdca',
      'podpora ciev',
      'podpora srdca',
      'srdce',
      'srdcovocievny systém',
    ],
  },
  {
    label: 'Krvný obeh',
    aliases: [
      'krvný obeh',
      'podpora krvného obehu',
      'prekrvenie',
      'zlepšenie krvného obehu',
      'zlepšuje krvný obeh',
    ],
  },
  {
    label: 'Dýchacie cesty',
    aliases: [
      'dýchacie cesty',
      'ochorenie dýchacích ciest',
      'podpora dýchania',
      'uvoľnenie dýchacích ciest',
      'zahlienenie',
    ],
  },
  {
    label: 'Pečeň a žlčník',
    aliases: [
      'detoxikácia pečene',
      'ochrana pečene',
      'pečeň',
      'podpora pečene',
      'žlčník',
    ],
  },
  {
    label: 'Obličky a močové cesty',
    aliases: [
      'močové cesty',
      'močový mechúr',
      'obličky',
      'ochrana močových ciest',
      'podpora obličiek',
      'prečistenie obličiek',
    ],
  },
  {
    label: 'Stres a psychická pohoda',
    aliases: [
      'duševná pohoda',
      'nervozita',
      'psychická záťaž',
      'psychika',
      'stres',
      'úzkosť',
    ],
  },
  {
    label: 'Pamäť a sústredenie',
    aliases: [
      'jasná myseľ',
      'mozgová činnosť',
      'pamäť',
      'podpora duševnej výkonnosti',
      'sústredenie',
      'zlepšuje pamäť',
    ],
  },
  {
    label: 'Zrak',
    aliases: [
      'ochrana zraku',
      'podpora zraku',
      'zdravý zrak',
      'zrak',
    ],
  },
  {
    label: 'Pokožka',
    aliases: [
      'ochrana pokožky',
      'pleť',
      'pokožka',
      'podpora pleti',
      'regenerácia pokožky',
      'starostlivosť o pleť',
      'zdravá pokožka',
    ],
  },
  {
    label: 'Vlasy a nechty',
    aliases: [
      'nechty',
      'podpora vlasov',
      'rast vlasov',
      'vlasy',
      'vypadávanie vlasov',
    ],
  },
  {
    label: 'Antioxidanty',
    aliases: [
      'antioxidant',
      'antioxidanty',
      'ochrana pred voľnými radikálmi',
      'oxidačný stres',
      'prírodné antioxidanty',
    ],
  },
  {
    label: 'Chudnutie a metabolizmus',
    aliases: [
      'chudnutie',
      'metabolizmus',
      'podpora chudnutia',
      'podpora metabolizmu',
      'schudnúť',
      'zníženie hmotnosti',
    ],
  },
  {
    label: 'Ženské zdravie',
    aliases: [
      'menopauza',
      'menštruácia',
      'menštruačné bolesti',
      'ženské zdravie',
      'ženy',
    ],
  },
  {
    label: 'Mužské zdravie',
    aliases: [
      'mužské zdravie',
      'potencia',
      'prostata',
      'pre mužov',
    ],
  },
  {
    label: 'Regenerácia',
    aliases: [
      'rekonvalescencia',
      'regenerácia',
      'regenerácia tela',
      'regeneračné účinky',
    ],
  },
  {
    label: 'Alergie',
    aliases: [
      'alergia',
      'alergie',
      'alergie a ekzémy',
      'ekzém',
      'ekzémy',
    ],
  },
] as const satisfies readonly ProductEffectDefinition[]

const PRODUCT_TYPE_DENYLIST = new Set([
  'all products',
  'nezaradene',
  'product',
  'products',
  'uncategorized',
  'vsetky produkty',
])

function normalizeFacetKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sk')
    .replace(/&/g, ' a ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const EFFECT_BY_ALIAS = new Map<string, string>()

for (const effect of PRODUCT_EFFECT_TAXONOMY) {
  for (const alias of [effect.label, ...effect.aliases]) {
    EFFECT_BY_ALIAS.set(normalizeFacetKey(alias), effect.label)
  }
}

/**
 * Returns only canonical effect labels in taxonomy order.
 * Unknown tags are intentionally ignored instead of guessed from substrings.
 */
export function getProductEffectLabels(tags: readonly string[] | null | undefined): string[] {
  if (!tags?.length) return []

  const matched = new Set<string>()
  for (const tag of tags) {
    const label = EFFECT_BY_ALIAS.get(normalizeFacetKey(tag))
    if (label) matched.add(label)
  }

  return PRODUCT_EFFECT_TAXONOMY
    .map((effect) => effect.label)
    .filter((label) => matched.has(label))
}

/** Returns a display-safe product type or null for generic/noisy categories. */
export function normalizeProductTypeFacet(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return PRODUCT_TYPE_DENYLIST.has(normalizeFacetKey(trimmed)) ? null : trimmed
}

/** Picks the deepest non-generic category, preserving parent fallback. */
export function getDeepestVisibleProductType(
  categoryNames: readonly (string | null | undefined)[],
): string {
  for (let index = categoryNames.length - 1; index >= 0; index -= 1) {
    const productType = normalizeProductTypeFacet(categoryNames[index])
    if (productType) return productType
  }
  return ''
}
