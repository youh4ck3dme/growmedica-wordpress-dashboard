#!/usr/bin/env node
/**
 * Shopify Storefront API smoke test (live catalog from growmedica.myshopify.com).
 *
 * Usage:
 *   node scripts/shopify-smoke-test.mjs
 *   SHOPIFY_STORE_DOMAIN=growmedica.myshopify.com SHOPIFY_STOREFRONT_ACCESS_TOKEN=... node scripts/shopify-smoke-test.mjs
 *
 * Requires Storefront API token — NOT shpat_ (Admin token).
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
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

const PRODUCTS_QUERY = /* GraphQL */ `
  query ShopifySmokeProducts($first: Int!) {
    products(first: $first) {
      pageInfo { hasNextPage }
      edges {
        node {
          handle
          title
          availableForSale
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
`

const COLLECTIONS_QUERY = /* GraphQL */ `
  query ShopifySmokeCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          handle
          title
        }
      }
    }
  }
`

function isTokenlessMode() {
  return process.env.SHOPIFY_STOREFRONT_TOKENLESS === '1'
}

function buildStorefrontHeaders(token, apiVersion) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Api-Version': apiVersion,
  }
  if (!isTokenlessMode() && token) {
    headers['X-Shopify-Storefront-Access-Token'] = token
  }
  return headers
}

async function storefrontGraphql(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || '2025-01'
  const tokenless = isTokenlessMode()

  if (!domain?.endsWith('.myshopify.com')) {
    throw new Error('SHOPIFY_STORE_DOMAIN must end with .myshopify.com (e.g. growmedica.myshopify.com)')
  }
  if (!tokenless) {
    if (!token || token.length < 10) {
      throw new Error(
        'Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN — run yarn setup:env, set SHOPIFY_STOREFRONT_TOKENLESS=1, or set in .env.local',
      )
    }
    if (token.startsWith('shpat_')) {
      throw new Error(
        'SHOPIFY_STOREFRONT_ACCESS_TOKEN looks like Admin token (shpat_). ' +
          'Use Storefront API token from Shopify Admin → Settings → Apps → Develop apps.',
      )
    }
  }

  const url = `https://${domain}/api/${apiVersion}/graphql.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildStorefrontHeaders(token, apiVersion),
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Storefront API HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  const body = await res.json()
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join('; '))
  }
  return body.data
}

async function main() {
  loadEnvLocal()

  const cmsProvider = process.env.CMS_PROVIDER?.trim() || 'shopify'
  const mockMode = process.env.SHOPIFY_MOCK_MODE === '1'

  console.log('=== Shopify Storefront API smoke ===')
  console.log(`CMS_PROVIDER: ${cmsProvider}`)
  console.log(`Store: ${process.env.SHOPIFY_STORE_DOMAIN ?? '(missing)'}`)
  console.log(`API version: ${process.env.SHOPIFY_API_VERSION ?? '2025-01'}`)
  console.log(`Tokenless: ${isTokenlessMode() ? 'yes' : 'no'}`)

  if (mockMode) {
    console.warn('WARN: SHOPIFY_MOCK_MODE=1 — unset for live Shopify smoke')
  }

  const productsData = await storefrontGraphql(PRODUCTS_QUERY, { first: 5 })
  const products = productsData.products.edges.map((e) => e.node)
  const hasMore = productsData.products.pageInfo.hasNextPage

  console.log(`✓ Products: fetched ${products.length}${hasMore ? '+' : ''} from live Storefront API`)
  for (const p of products.slice(0, 3)) {
    console.log(`  - ${p.handle}: ${p.title} (${p.priceRange.minVariantPrice.amount} ${p.priceRange.minVariantPrice.currencyCode})`)
  }

  const collectionsData = await storefrontGraphql(COLLECTIONS_QUERY, { first: 50 })
  const collections = collectionsData.collections.edges.map((e) => e.node)
  console.log(`✓ Collections: ${collections.length} handles (sample: ${collections.slice(0, 5).map((c) => c.handle).join(', ')})`)

  console.log('\nAll Shopify smoke checks passed.')
  console.log('Next: yarn dev → curl http://localhost:5555/api/products')
}

main().catch((error) => {
  console.error('Shopify smoke failed:', error.message)
  process.exit(1)
})
