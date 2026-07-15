import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const STOREFRONT_ROOT = resolve(__dirname, '../..')

/** Canonical store — tn43yx-0k.myshopify.com redirects here (same shop, 460 products). */
export const CANONICAL_SHOPIFY_STORE = 'growmedica.myshopify.com'

export function loadEnvLocal(root = STOREFRONT_ROOT) {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

let cachedClientCredentialsToken = null
let cachedClientCredentialsExpiresAt = 0

export function getShopifyAdminConfig() {
  return {
    store: process.env.SHOPIFY_STORE_DOMAIN ?? CANONICAL_SHOPIFY_STORE,
    token: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim(),
    apiVersion: process.env.SHOPIFY_API_VERSION ?? '2025-01',
  }
}

/** OAuth client credentials (Dev Dashboard app, 2025+) — token platí ~24 h. */
export async function fetchClientCredentialsToken(
  store = getShopifyAdminConfig().store,
  clientId = process.env.SHOPIFY_CLIENT_ID?.trim(),
  clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim(),
) {
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

  const json = JSON.parse(text)
  if (!json.access_token) {
    throw new Error(`Client credentials response missing access_token: ${text}`)
  }

  cachedClientCredentialsToken = json.access_token
  cachedClientCredentialsExpiresAt = Date.now() + (json.expires_in ?? 86_399) * 1000
  return cachedClientCredentialsToken
}

/** Legacy shpat_ alebo client credentials token. */
export async function resolveAdminAccessToken(config = getShopifyAdminConfig()) {
  const legacy = config.token?.trim()
  if (legacy?.startsWith('shpat_')) return legacy

  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim()
  if (clientId && clientSecret) {
    return fetchClientCredentialsToken(config.store, clientId, clientSecret)
  }

  return legacy ?? ''
}

export function assertAdminConfig({ store, token, dryRun = false }) {
  if (!store?.endsWith('.myshopify.com')) {
    if (!dryRun) {
      throw new Error('Missing SHOPIFY_STORE_DOMAIN in .env.local (must end with .myshopify.com)')
    }
  }
  if (!token?.startsWith('shpat_')) {
    if (dryRun) {
      console.warn('No SHOPIFY_ADMIN_ACCESS_TOKEN — dry-run listing only.\n')
      return false
    }
    throw new Error(
      'Missing SHOPIFY_ADMIN_ACCESS_TOKEN (shpat_...) in .env.local.\n' +
        'Shopify Admin → Settings → Apps → Develop apps → Admin API scopes:\n' +
        '  read_products, write_products, read_inventory, write_inventory',
    )
  }
  return true
}

export async function adminGraphql(query, variables = {}, config = getShopifyAdminConfig()) {
  const { store, apiVersion } = config
  const token = await resolveAdminAccessToken(config)
  if (!token) {
    throw new Error('No Admin API token — set SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID+SECRET')
  }
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

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  return json.data
}

export function parseArgValue(name, fallback) {
  const prefixed = process.argv.find((a) => a.startsWith(`${name}=`))
  return prefixed ? prefixed.split('=').slice(1).join('=') : fallback
}

export function parseArgFlag(name) {
  return process.argv.includes(name)
}

const DEVELOP_APPS_URL = 'https://admin.shopify.com/store/growmedica/settings/apps/development'

/** REST shop.json — jasnejší 403 „API Access has been disabled“ než GraphQL. */
export async function verifyAdminTokenRest(token, config = getShopifyAdminConfig()) {
  if (!token?.startsWith('shpat_')) {
    return {
      ok: false,
      code: 'missing_token',
      message: 'Missing or invalid SHOPIFY_ADMIN_ACCESS_TOKEN (must start with shpat_)',
    }
  }

  const store = config.store ?? CANONICAL_SHOPIFY_STORE
  const apiVersion = config.apiVersion ?? '2025-01'

  try {
    const res = await fetch(`https://${store}/admin/api/${apiVersion}/shop.json`, {
      headers: { 'X-Shopify-Access-Token': token },
    })
    const text = await res.text()
    if (!res.ok) {
      if (res.status === 403 && text.includes('API Access has been disabled')) {
        return {
          ok: false,
          code: '403_api_disabled',
          message: 'Shopify Admin API disabled — v Admin klikni Install app (token sám o sebe nestačí)',
          human_url: DEVELOP_APPS_URL,
          install_steps: [
            'Otvor Develop apps → tvoja app (GrowMedica Nexus)',
            'Configure Admin API scopes → Save',
            'API credentials → Install app (povinné!)',
            'Potom znova: yarn shopify:admin-verify',
          ],
          shopify_error: text,
        }
      }
      if (res.status === 401) {
        return {
          ok: false,
          code: '401_unauthorized',
          message: 'Invalid or revoked Admin token',
          human_url: DEVELOP_APPS_URL,
        }
      }
      return { ok: false, code: 'error', message: `Admin REST HTTP ${res.status}: ${text.slice(0, 200)}` }
    }

    const shopJson = JSON.parse(text)
    return {
      ok: true,
      code: 'ok',
      shop: shopJson.shop?.name,
      domain: shopJson.shop?.myshopify_domain ?? store,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, code: 'error', message: msg }
  }
}
