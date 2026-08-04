/**
 * URL <-> product filter state (shareable /produkty query params).
 *
 * Params:
 *   q, vendor (repeat or comma), type, effect, sort, priceMin, priceMax
 */

export type ProductFilterUrlState = {
  q: string
  vendors: string[]
  types: string[]
  effects: string[]
  sort: string
  priceMin: number | null
  priceMax: number | null
  /** Minimum star threshold facet (e.g. 4 = "4★ a viac") */
  minRating?: number | null
  /** Dynamic Woo product attribute facets (e.g. Certifikácia, Veková skupina), keyed by attribute label */
  attributes?: Record<string, string[]>
}

const DEFAULT_SORT = 'BEST_SELLING'
const ATTR_GROUP_SEPARATOR = ';'
const ATTR_KEY_VALUE_SEPARATOR = ':'
const ATTR_VALUE_SEPARATOR = ','

function encodeAttributesParam(attributes: Record<string, string[]> | undefined): string {
  if (!attributes) return ''
  const groups = Object.entries(attributes)
    .map(([label, values]) => [label.trim(), [...new Set(values.map((v) => v.trim()).filter(Boolean))]] as const)
    .filter(([label, values]) => label && values.length > 0)
    .map(([label, values]) => `${label}${ATTR_KEY_VALUE_SEPARATOR}${values.join(ATTR_VALUE_SEPARATOR)}`)
  return groups.join(ATTR_GROUP_SEPARATOR)
}

function decodeAttributesParam(raw: string | null): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  if (!raw) return result
  for (const group of raw.split(ATTR_GROUP_SEPARATOR)) {
    const separatorIndex = group.indexOf(ATTR_KEY_VALUE_SEPARATOR)
    if (separatorIndex <= 0) continue
    const label = group.slice(0, separatorIndex).trim()
    const values = splitList([group.slice(separatorIndex + 1)])
    if (label && values.length > 0) result[label] = values
  }
  return result
}

function splitList(values: string[]): string[] {
  const out: string[] = []
  for (const value of values) {
    for (const part of value.split(',')) {
      const trimmed = part.trim()
      if (trimmed) out.push(trimmed)
    }
  }
  return [...new Set(out)]
}

function parseOptionalInt(raw: string | null): number | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? Math.floor(n) : null
}

export function parseProductFilterSearchParams(
  params: URLSearchParams | { get: (k: string) => string | null; getAll: (k: string) => string[] },
): ProductFilterUrlState {
  const vendors = splitList([
    ...params.getAll('vendor'),
    ...(params.get('vendors') ? [params.get('vendors')!] : []),
  ])
  const types = splitList([
    ...params.getAll('type'),
    ...(params.get('types') ? [params.get('types')!] : []),
  ])
  const effects = splitList([
    ...params.getAll('effect'),
    ...params.getAll('tag'),
    ...(params.get('effects') ? [params.get('effects')!] : []),
  ])
  const sort = params.get('sort')?.trim() || DEFAULT_SORT

  return {
    q: params.get('q')?.trim() || '',
    vendors,
    types,
    effects,
    sort,
    priceMin: parseOptionalInt(params.get('priceMin')),
    priceMax: parseOptionalInt(params.get('priceMax')),
    minRating: parseOptionalInt(params.get('rating')),
    attributes: decodeAttributesParam(params.get('attrs')),
  }
}

export function buildProductFilterSearchParams(
  state: ProductFilterUrlState,
  options?: { priceLimits?: { min: number; max: number } },
): URLSearchParams {
  const params = new URLSearchParams()
  if (state.q.trim()) params.set('q', state.q.trim())
  for (const vendor of state.vendors) params.append('vendor', vendor)
  for (const type of state.types) params.append('type', type)
  for (const effect of state.effects) params.append('effect', effect)
  if (state.sort && state.sort !== DEFAULT_SORT) params.set('sort', state.sort)

  const limits = options?.priceLimits
  if (
    state.priceMin != null &&
    limits &&
    state.priceMin > limits.min
  ) {
    params.set('priceMin', String(state.priceMin))
  }
  if (
    state.priceMax != null &&
    limits &&
    state.priceMax < limits.max
  ) {
    params.set('priceMax', String(state.priceMax))
  }
  // Without limits still write when explicitly set
  if (!limits) {
    if (state.priceMin != null) params.set('priceMin', String(state.priceMin))
    if (state.priceMax != null) params.set('priceMax', String(state.priceMax))
  }

  if (state.minRating != null && state.minRating > 0) {
    params.set('rating', String(state.minRating))
  }

  const attrsParam = encodeAttributesParam(state.attributes)
  if (attrsParam) params.set('attrs', attrsParam)

  return params
}

export function productFilterSearchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  return a.toString() === b.toString()
}
