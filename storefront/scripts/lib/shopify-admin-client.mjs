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

export function getShopifyAdminConfig() {
  return {
    store: process.env.SHOPIFY_STORE_DOMAIN,
    token: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: process.env.SHOPIFY_API_VERSION ?? '2025-01',
  }
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
  const { store, token, apiVersion } = config
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
