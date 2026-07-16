import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const STOREFRONT_ROOT = resolve(__dirname, '../..')

/** Canonical store — tn43yx-0k.myshopify.com redirects here (same shop, 460 products). */
export const CANONICAL_SHOPIFY_STORE = 'growmedica.myshopify.com'
export const DEFAULT_SHOPIFY_API_VERSION = '2026-07'
export const REQUIRED_ADMIN_SCOPES = Object.freeze([
  'read_products',
  'write_products',
  'read_inventory',
  'write_inventory',
])

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
    apiVersion: process.env.SHOPIFY_API_VERSION ?? DEFAULT_SHOPIFY_API_VERSION,
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

/** Prefer renewable Dev Dashboard credentials; fall back to a legacy Admin token. */
export async function resolveAdminAccessToken(config = getShopifyAdminConfig()) {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim()
  if (clientId || clientSecret) {
    if (!clientId || !clientSecret) {
      throw new Error('SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be set together')
    }
    return fetchClientCredentialsToken(config.store, clientId, clientSecret)
  }

  const legacy = config.token?.trim()
  return legacy ?? ''
}

export function assertAdminConfig({ store, token, dryRun = false }) {
  if (!store?.endsWith('.myshopify.com')) {
    if (!dryRun) {
      throw new Error('Missing SHOPIFY_STORE_DOMAIN in .env.local (must end with .myshopify.com)')
    }
  }
  const hasClientCredentials = Boolean(
    process.env.SHOPIFY_CLIENT_ID?.trim() && process.env.SHOPIFY_CLIENT_SECRET?.trim(),
  )
  if (!token?.trim() && !hasClientCredentials) {
    if (dryRun) {
      console.warn('No Shopify Admin credentials — dry-run listing only.\n')
      return false
    }
    throw new Error(
      'Missing Shopify Admin credentials in .env.local. Set SHOPIFY_CLIENT_ID + ' +
        'SHOPIFY_CLIENT_SECRET (preferred) or SHOPIFY_ADMIN_ACCESS_TOKEN.\n' +
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
  if (!token?.trim()) {
    return {
      ok: false,
      code: 'missing_token',
      message: 'Missing Shopify Admin access token',
    }
  }

  const store = config.store ?? CANONICAL_SHOPIFY_STORE
  const apiVersion = config.apiVersion ?? DEFAULT_SHOPIFY_API_VERSION

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
    const servedApiVersion = res.headers.get('x-shopify-api-version')
    if (servedApiVersion && servedApiVersion !== apiVersion) {
      return {
        ok: false,
        code: 'api_version_fallback',
        message:
          `Shopify served API ${servedApiVersion} instead of requested ${apiVersion}; ` +
          'the configured version is inaccessible and must be upgraded.',
        requested_api_version: apiVersion,
        served_api_version: servedApiVersion,
      }
    }
    return {
      ok: true,
      code: 'ok',
      shop: shopJson.shop?.name,
      domain: shopJson.shop?.myshopify_domain ?? store,
      api_version: servedApiVersion ?? apiVersion,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, code: 'error', message: msg }
  }
}

/** Verify that the installed app has the scopes required by GrowMedica Admin writes. */
export async function verifyAdminScopesGraphql(
  token,
  config = getShopifyAdminConfig(),
  requiredScopes = REQUIRED_ADMIN_SCOPES,
) {
  if (!token?.trim()) {
    return {
      ok: false,
      code: 'missing_token',
      message: 'Missing Shopify Admin access token',
      required: [...requiredScopes],
      granted: [],
      missing: [...requiredScopes],
    }
  }

  const store = config.store ?? CANONICAL_SHOPIFY_STORE
  const apiVersion = config.apiVersion ?? DEFAULT_SHOPIFY_API_VERSION

  try {
    const res = await fetch(`https://${store}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query: `query GrowMedicaGrantedScopes {
          currentAppInstallation {
            accessScopes { handle }
          }
        }`,
      }),
    })
    const text = await res.text()
    if (!res.ok) {
      return {
        ok: false,
        code: 'scope_check_http_error',
        message: `Admin GraphQL HTTP ${res.status}: ${text.slice(0, 200)}`,
        required: [...requiredScopes],
        granted: [],
        missing: [...requiredScopes],
      }
    }

    const json = JSON.parse(text)
    if (json.errors?.length) {
      return {
        ok: false,
        code: 'scope_check_graphql_error',
        message: json.errors.map((error) => error.message).join('; '),
        required: [...requiredScopes],
        granted: [],
        missing: [...requiredScopes],
      }
    }

    const granted = (json.data?.currentAppInstallation?.accessScopes ?? [])
      .map((scope) => scope.handle)
      .filter(Boolean)
      .sort()
    const missing = requiredScopes.filter((scope) => !granted.includes(scope))
    return {
      ok: missing.length === 0,
      code: missing.length === 0 ? 'ok' : 'missing_scopes',
      message:
        missing.length === 0
          ? 'Required Shopify Admin scopes are granted'
          : `Missing Shopify Admin scopes: ${missing.join(', ')}`,
      required: [...requiredScopes],
      granted,
      missing,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      code: 'scope_check_error',
      message,
      required: [...requiredScopes],
      granted: [],
      missing: [...requiredScopes],
    }
  }
}
