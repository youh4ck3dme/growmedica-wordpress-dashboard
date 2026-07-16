#!/usr/bin/env node
/**
 * Audit category-map.ts slugs vs Shopify collection handles + productType/tag coverage.
 *
 * Usage:
 *   node --experimental-strip-types scripts/shopify-collections-audit.mjs
 *   node --experimental-strip-types scripts/shopify-collections-audit.mjs --public
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCategory } from '../src/lib/category-map.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const HIDDEN = new Set(['frontpage', 'all'])

const NAV_SLUGS = [
  'sportova-vyziva',
  'regeneracia',
  'zdrave-potraviny',
  'vitaminy-mineraly',
  'klby-pohyb',
  'imunita',
  'travenie',
  'srdce-cievy',
  'spanok-stres',
  'krasa-pokozka',
  'detox-pecen',
  'proteiny',
  'aminokyseliny',
  'specialna-vyziva',
  'ostatne',
]

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

async function storefrontGraphql(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || '2026-07'

  const tokenless = process.env.SHOPIFY_STOREFRONT_TOKENLESS === '1'
  if (!domain || (!tokenless && !token)) {
    return null
  }
  if (token?.startsWith('shpat_')) {
    throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN is Admin token (shpat_) — use Storefront API token')
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Api-Version': apiVersion,
  }
  if (!tokenless && token) {
    headers['X-Shopify-Storefront-Access-Token'] = token
  }

  const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const body = await res.json()
  if (!res.ok || body.errors?.length) {
    throw new Error(body.errors?.map((e) => e.message).join('; ') ?? `HTTP ${res.status}`)
  }
  return body.data
}

const COLLECTIONS_QUERY = /* GraphQL */ `
  query AllCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { handle title } }
    }
  }
`

async function fetchAllCollectionsGraphql() {
  const all = []
  let after
  let hasNext = true
  while (hasNext) {
    const data = await storefrontGraphql(COLLECTIONS_QUERY, { first: 250, after })
    for (const edge of data.collections.edges) {
      all.push(edge.node)
    }
    hasNext = data.collections.pageInfo.hasNextPage
    after = data.collections.pageInfo.endCursor ?? undefined
  }
  return all
}

async function fetchPublicCollections(domain) {
  const res = await fetch(`https://${domain}/collections.json?limit=250`)
  if (!res.ok) throw new Error(`Public collections HTTP ${res.status}`)
  const body = await res.json()
  return (body.collections ?? []).map((c) => ({ handle: c.handle, title: c.title }))
}

async function fetchPublicProducts(domain) {
  const products = []
  let page = 1
  while (page <= 20) {
    const res = await fetch(`https://${domain}/products.json?limit=250&page=${page}`)
    if (!res.ok) throw new Error(`Public products HTTP ${res.status} page=${page}`)
    const body = await res.json()
    const batch = body.products ?? []
    if (!batch.length) break
    for (const p of batch) {
      products.push({
        handle: p.handle,
        title: p.title,
        productType: p.product_type ?? '',
        tags: typeof p.tags === 'string' ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })
    }
    if (batch.length < 250) break
    page += 1
  }
  return products
}

function printCollectionAudit(collections) {
  const shopifyHandles = new Set(
    collections.filter((c) => !HIDDEN.has(c.handle)).map((c) => c.handle),
  )

  console.log(`Shopify collections (excl. frontpage/all): ${shopifyHandles.size}`)

  const matched = []
  const missingCollection = []

  for (const slug of NAV_SLUGS) {
    if (slug === 'ostatne') continue
    if (shopifyHandles.has(slug)) {
      matched.push(slug)
    } else {
      missingCollection.push(slug)
    }
  }

  console.log(`\nNav slugs with matching Shopify collection handle: ${matched.length}/${NAV_SLUGS.length - 1}`)
  if (matched.length) console.log(`  ${matched.join(', ')}`)

  if (missingCollection.length) {
    console.log(`\nNav slugs WITHOUT Shopify collection (OK — uses productType/tag rules):`)
    for (const slug of missingCollection) {
      console.log(`  - ${slug}`)
    }
  }

  const extraShopify = [...shopifyHandles].filter((h) => !NAV_SLUGS.includes(h))
  if (extraShopify.length) {
    console.log(`\nExtra Shopify collections (not in category-map nav):`)
    for (const h of extraShopify.sort().slice(0, 20)) {
      const title = collections.find((c) => c.handle === h)?.title ?? h
      console.log(`  - ${h} (${title})`)
    }
  }
}

function printCategoryCoverage(products) {
  const counts = Object.fromEntries(NAV_SLUGS.map((s) => [s, 0]))
  for (const p of products) {
    counts[resolveCategory({ productType: p.productType, tags: p.tags })] += 1
  }

  console.log(`\nProduct coverage via category-map rules (${products.length} products sampled):`)
  for (const slug of NAV_SLUGS) {
    const count = counts[slug]
    const marker = count === 0 && slug !== 'ostatne' ? ' ⚠ empty' : ''
    console.log(`  ${slug}: ${count}${marker}`)
  }

  const productTypes = new Map()
  for (const p of products) {
    const key = p.productType || '(empty)'
    productTypes.set(key, (productTypes.get(key) ?? 0) + 1)
  }
  const topTypes = [...productTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  console.log('\nTop product_type values in store:')
  for (const [type, count] of topTypes) {
    console.log(`  ${type}: ${count}`)
  }
}

async function main() {
  loadEnvLocal()

  const forcePublic = process.argv.includes('--public')
  const domain = (process.env.SHOPIFY_STORE_DOMAIN?.trim() || 'growmedica.myshopify.com').replace(/^https?:\/\//, '')
  const hasToken =
    !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() &&
    !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN.startsWith('shpat_')

  console.log('=== Shopify collections audit (category-map vs live store) ===')
  console.log(`Store: ${domain}`)
  console.log(`Mode: ${forcePublic || !hasToken ? 'public JSON (no Storefront token)' : 'Storefront GraphQL'}\n`)

  let collections
  if (!forcePublic && hasToken) {
    process.env.SHOPIFY_STORE_DOMAIN = domain
    collections = await fetchAllCollectionsGraphql()
  } else {
    if (!forcePublic && !hasToken) {
      console.log('→ No valid Storefront token — falling back to public Shopify JSON endpoints\n')
    }
    collections = await fetchPublicCollections(domain)
  }

  printCollectionAudit(collections)

  const products = await fetchPublicProducts(domain)
  printCategoryCoverage(products)

  console.log('\nNote: Storefront nav uses category-map rules + optional Shopify collection metadata.')
  console.log('growmedica.myshopify.com has few manual collections — category pages rely on productType/tags.')
  console.log('\nAudit complete.')
}

main().catch((error) => {
  console.error('Audit failed:', error.message)
  process.exit(1)
})
