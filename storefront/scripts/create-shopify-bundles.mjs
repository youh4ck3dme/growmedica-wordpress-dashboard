#!/usr/bin/env node
/**
 * Create health bundle products in Shopify Admin (first N from catalog.ts).
 *
 * Requires in .env.local (never commit):
 *   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...  (Admin API, write_products)
 *   SHOPIFY_API_VERSION=2025-01
 *
 * Usage:
 *   node scripts/create-shopify-bundles.mjs
 *   node scripts/create-shopify-bundles.mjs --limit 10
 *   node scripts/create-shopify-bundles.mjs --dry-run
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadEnvFile(path) {
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

loadEnvFile(resolve(ROOT, '.env.local'))

const STORE = process.env.SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-01'
const dryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : 10

const ITEM_UNIT_EUR = 14.9

/** First 10 bundles — keep in sync with catalog.ts ids 1–10 */
const BUNDLES = [
  {
    slug: 'imunitny-stit-basic',
    name: 'Imunitný Štít Basic',
    tags: ['balicek-zdravia', 'Imunita'],
    items: ['Vitamín C 1000 mg', 'Vitamín D3 2000 IU', 'Zinok'],
    discountPercent: 10,
  },
  {
    slug: 'imunitny-stit-plus',
    name: 'Imunitný Štít Plus',
    tags: ['balicek-zdravia', 'Imunita'],
    items: ['Vitamín C 1000 mg', 'Vitamín D3 2000 IU', 'Zinok', 'Selén', 'Probiotiká'],
    discountPercent: 12,
  },
  {
    slug: 'imunita-jesen-zima',
    name: 'Imunita na jeseň/zimu',
    tags: ['balicek-zdravia', 'Imunita'],
    items: ['Vitamín C', 'Vitamín D3', 'Echinacea', 'Beta-glukán'],
    discountPercent: 12,
  },
  {
    slug: 'rodinna-imunita',
    name: 'Rodinná imunita',
    tags: ['balicek-zdravia', 'Imunita'],
    items: ['Detský multivitamín', 'Multivitamín pre dospelých', 'Vitamín D3'],
    discountPercent: 15,
  },
  {
    slug: 'imunita-energia',
    name: 'Imunita & energia',
    tags: ['balicek-zdravia', 'Imunita'],
    items: ['Vitamín C', 'Cordyceps', 'CoQ10'],
    discountPercent: 12,
  },
  {
    slug: 'pokojny-vecer',
    name: 'Pokojný večer',
    tags: ['balicek-zdravia', 'Spánok', 'Stres'],
    items: ['Magnézium', 'L-theanín', 'Melatonín'],
    discountPercent: 10,
  },
  {
    slug: 'anti-stres-den',
    name: 'Anti-stres deň',
    tags: ['balicek-zdravia', 'Stres'],
    items: ['Ashwagandha', 'B-komplex', 'Magnézium'],
    discountPercent: 12,
  },
  {
    slug: 'hlboky-spanok',
    name: 'Hlboký spánok',
    tags: ['balicek-zdravia', 'Spánok'],
    items: ['Melatonín', 'Valeriana', 'Magnézium glycinát'],
    discountPercent: 12,
  },
  {
    slug: 'office-relax',
    name: 'Office relax',
    tags: ['balicek-zdravia', 'Stres'],
    items: ['Ashwagandha', 'Omega-3', 'Vitamín B12'],
    discountPercent: 12,
  },
  {
    slug: 'spanok-krasa',
    name: 'Spánok & krása',
    tags: ['balicek-zdravia', 'Spánok', 'Krása'],
    items: ['Magnézium', 'Kolagén', 'Hyaluron'],
    discountPercent: 15,
  },
].slice(0, limit)

function estimatePricing(bundle) {
  const compareAt = Math.round(bundle.items.length * ITEM_UNIT_EUR * 100) / 100
  const price =
    Math.round(compareAt * (1 - bundle.discountPercent / 100) * 100) / 100
  return {
    compareAt: compareAt.toFixed(2),
    price: price.toFixed(2),
  }
}

function buildDescriptionHtml(items) {
  const list = items.map((item) => `<li>${item}</li>`).join('')
  return `<p>Balíček GrowMedica — obsahuje:</p><ul>${list}</ul><p><em>Ceny komponentov sú orientačné; upravte compare-at price podľa skutočných SKU.</em></p>`
}

async function adminGraphql(query, variables = {}) {
  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
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

async function getOnlineStorePublicationId() {
  const data = await adminGraphql(`
    query {
      publications(first: 20) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `)
  const online = data.publications.edges.find(
    (e) => e.node.name === 'Online Store' || e.node.name === 'Online obchod',
  )
  return online?.node.id ?? data.publications.edges[0]?.node.id
}

async function productExistsByHandle(handle) {
  const data = await adminGraphql(
    `query($handle: String!) {
      productByHandle(handle: $handle) { id handle }
    }`,
    { handle },
  )
  return data.productByHandle
}

async function createBundleProduct(bundle, publicationId) {
  const handle = `balicek-${bundle.slug}`
  const { compareAt, price } = estimatePricing(bundle)

  if (dryRun) {
    console.log(`[dry-run] ${handle} — ${price} EUR (was ${compareAt} EUR, −${bundle.discountPercent}%)`)
    return { handle, dryRun: true }
  }

  const existing = await productExistsByHandle(handle)
  if (existing) {
    console.log(`skip (exists): ${handle}`)
    return { handle, skipped: true }
  }

  const data = await adminGraphql(
    `mutation($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product { id handle }
        userErrors { field message }
      }
    }`,
    {
      product: {
        title: `Balíček: ${bundle.name}`,
        handle,
        tags: bundle.tags,
        productType: 'Balíček zdravia',
        status: 'ACTIVE',
        descriptionHtml: buildDescriptionHtml(bundle.items),
        variants: [
          {
            price,
            compareAtPrice: compareAt,
            inventoryPolicy: 'CONTINUE',
            inventoryItem: { tracked: false },
          },
        ],
      },
    },
  )

  const errors = data.productCreate.userErrors
  if (errors?.length) {
    throw new Error(`${handle}: ${errors.map((e) => e.message).join(', ')}`)
  }

  const productId = data.productCreate.product.id

  if (publicationId) {
    await adminGraphql(
      `mutation($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          userErrors { message }
        }
      }`,
      {
        id: productId,
        input: [{ publicationId }],
      },
    )
  }

  console.log(`created: ${handle} — ${price} EUR (compare ${compareAt} EUR)`)
  return { handle, created: true }
}

async function main() {
  if (!STORE?.endsWith('.myshopify.com')) {
    if (!dryRun) {
      console.error('Missing SHOPIFY_STORE_DOMAIN in .env.local')
      process.exit(1)
    }
  }
  if (!TOKEN?.startsWith('shpat_')) {
    if (dryRun) {
      console.warn('No SHOPIFY_ADMIN_ACCESS_TOKEN — dry-run pricing preview only.\n')
    } else {
      console.error(
        'Missing SHOPIFY_ADMIN_ACCESS_TOKEN (shpat_...) in .env.local.\n' +
          'Shopify Admin → Settings → Apps → Develop apps → Create app → Admin API scopes: write_products, read_products',
      )
      process.exit(1)
    }
  }

  console.log(`Store: ${STORE}`)
  console.log(`Creating up to ${BUNDLES.length} bundle products${dryRun ? ' (dry-run)' : ''}…`)

  const publicationId = dryRun ? null : await getOnlineStorePublicationId()

  for (const bundle of BUNDLES) {
    if (dryRun && !TOKEN) {
      const handle = `balicek-${bundle.slug}`
      const { compareAt, price } = estimatePricing(bundle)
      console.log(`[dry-run] ${handle} — ${price} EUR (was ${compareAt} EUR, −${bundle.discountPercent}%)`)
      continue
    }
    await createBundleProduct(bundle, publicationId)
  }

  console.log('Done. Revalidate cache or wait for webhook; then check /balicky')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
