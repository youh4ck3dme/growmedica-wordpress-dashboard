import type { ShopifyAdminConfig } from './types'

export const CANONICAL_SHOPIFY_STORE = 'growmedica.myshopify.com'
export const DEFAULT_SHOPIFY_API_VERSION = '2026-07'

let cachedClientCredentialsToken: string | null = null
let cachedClientCredentialsExpiresAt = 0

export function getShopifyAdminConfig(): ShopifyAdminConfig {
  return {
    store: process.env.SHOPIFY_STORE_DOMAIN?.trim() || CANONICAL_SHOPIFY_STORE,
    apiVersion: process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_SHOPIFY_API_VERSION,
  }
}

export async function fetchClientCredentialsToken(
  store = getShopifyAdminConfig().store,
  clientId = process.env.SHOPIFY_CLIENT_ID?.trim(),
  clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim(),
): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error('Missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET for client credentials grant')
  }
  if (cachedClientCredentialsToken && Date.now() < cachedClientCredentialsExpiresAt - 60_000) {
    return cachedClientCredentialsToken
  }

  const res = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Client credentials HTTP ${res.status}: ${text}`)
  }

  const json = JSON.parse(text) as { access_token?: string; expires_in?: number }
  if (!json.access_token) {
    throw new Error(`Client credentials response missing access_token: ${text}`)
  }

  cachedClientCredentialsToken = json.access_token
  cachedClientCredentialsExpiresAt = Date.now() + (json.expires_in ?? 86_399) * 1000
  return cachedClientCredentialsToken
}

export async function resolveAdminAccessToken(config = getShopifyAdminConfig()): Promise<string> {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim()
  if (clientId || clientSecret) {
    if (!clientId || !clientSecret) {
      throw new Error('SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be set together')
    }
    return fetchClientCredentialsToken(config.store, clientId, clientSecret)
  }

  const legacy = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim()
  if (!legacy) {
    throw new Error(
      'No Shopify Admin credentials — set SHOPIFY_CLIENT_ID+SECRET or SHOPIFY_ADMIN_ACCESS_TOKEN',
    )
  }
  return legacy
}

export function isShopifyAdminConfigured(): boolean {
  const hasClient =
    Boolean(process.env.SHOPIFY_CLIENT_ID?.trim()) &&
    Boolean(process.env.SHOPIFY_CLIENT_SECRET?.trim())
  const hasLegacy = Boolean(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim())
  return hasClient || hasLegacy
}

export async function adminGraphql<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {},
  config = getShopifyAdminConfig(),
): Promise<T> {
  const { store, apiVersion } = config
  const token = await resolveAdminAccessToken(config)
  const res = await fetch(`https://${store}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Admin API HTTP ${res.status}: ${await res.text()}`)
  }

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  if (!json.data) {
    throw new Error('Admin API returned no data')
  }
  return json.data
}
