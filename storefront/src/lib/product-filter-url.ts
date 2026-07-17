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
}

const DEFAULT_SORT = 'BEST_SELLING'

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

  return params
}

export function productFilterSearchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  return a.toString() === b.toString()
}
