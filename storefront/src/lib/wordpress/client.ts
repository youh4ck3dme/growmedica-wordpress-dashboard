/**
 * WooCommerce REST API client (server-side only).
 *
 * Uses consumer key/secret query auth for server-to-server calls.
 * Never expose credentials to the browser.
 */

import { validateWordPressEnv } from './env'

/** WooCommerce REST API hard limit for `per_page`. */
export const WOO_MAX_PER_PAGE = 100

export function clampWooPerPage(value: number | undefined, fallback = 24): number {
  const n = Number(value ?? fallback)
  if (!Number.isFinite(n)) return fallback
  return Math.min(WOO_MAX_PER_PAGE, Math.max(1, Math.floor(n)))
}

interface WooFetchOptions {
  path: string
  params?: Record<string, string | number | boolean | undefined>
  cache?: RequestCache
  revalidate?: number | false
  tags?: string[]
}

function buildWooUrl(
  baseUrl: string,
  consumerKey: string,
  consumerSecret: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): URL {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`/wp-json/wc/v3${normalizedPath}`, baseUrl)

  url.searchParams.set('consumer_key', consumerKey)
  url.searchParams.set('consumer_secret', consumerSecret)

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  return url
}

export async function wooFetch<T>({
  path,
  params,
  cache = 'force-cache',
  revalidate = 3600,
  tags,
}: WooFetchOptions): Promise<T> {
  const env = validateWordPressEnv()
  const url = buildWooUrl(
    env.WORDPRESS_BASE_URL,
    env.WOO_CONSUMER_KEY,
    env.WOO_CONSUMER_SECRET,
    path,
    params,
  )

  const nextOptions: RequestInit['next'] = {}
  if (revalidate !== false) {
    nextOptions.revalidate = revalidate
  }
  if (tags && tags.length > 0) {
    nextOptions.tags = tags
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(env.WORDPRESS_BASE_URL.startsWith('http://')
        ? { 'X-Forwarded-Proto': 'https' }
        : {}),
    },
    cache,
    next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined,
  })

  if (!response.ok) {
    throw new Error(
      `WooCommerce API error: ${response.status} ${response.statusText} — ${await response.text()}`,
    )
  }

  return (await response.json()) as T
}

export async function wooFetchPaginated<T>({
  path,
  params,
  cache,
  revalidate,
  tags,
}: WooFetchOptions): Promise<{
  items: T[]
  total: number
  totalPages: number
  page: number
  perPage: number
}> {
  const page = Number(params?.page ?? 1)
  const perPage = clampWooPerPage(params?.per_page as number | undefined)
  const requestParams = { ...params, page, per_page: perPage }

  const response = await fetch(
    buildWooUrl(
      validateWordPressEnv().WORDPRESS_BASE_URL,
      validateWordPressEnv().WOO_CONSUMER_KEY,
      validateWordPressEnv().WOO_CONSUMER_SECRET,
      path,
      requestParams,
    ).toString(),
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: cache ?? 'force-cache',
      next: {
        ...(revalidate !== false ? { revalidate: revalidate ?? 3600 } : {}),
        ...(tags ? { tags } : {}),
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `WooCommerce API error: ${response.status} ${response.statusText} — ${await response.text()}`,
    )
  }

  const total = Number(response.headers.get('x-wp-total') ?? 0)
  const totalPages = Number(response.headers.get('x-wp-totalpages') ?? 1)
  const items = (await response.json()) as T[]

  return { items, total, totalPages, page, perPage }
}