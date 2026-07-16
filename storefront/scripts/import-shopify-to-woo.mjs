#!/usr/bin/env node
/**
 * Import Shopify products → WooCommerce on cms.growmedica.cz (mirror; shop master stays Shopify).
 *
 * Usage:
 *   node scripts/import-shopify-to-woo.mjs --dry-run --limit=5
 *   node scripts/import-shopify-to-woo.mjs --limit=5
 *   node scripts/import-shopify-to-woo.mjs --handle=my-product
 *   node scripts/import-shopify-to-woo.mjs --update --limit=50
 *   node scripts/import-shopify-to-woo.mjs --skip-images --limit=20
 *
 * Env: storefront/.env.local
 *   SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (or legacy admin token)
 *   WORDPRESS_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadEnvLocal as loadShopifyEnv,
  adminGraphql,
  parseArgFlag,
  parseArgValue,
  resolveAdminAccessToken,
  getShopifyAdminConfig,
  assertAdminConfig,
} from './lib/shopify-admin-client.mjs'
import {
  loadEnvLocal as loadWooEnv,
  getWooConfig,
  wooGet,
  wooPost,
  wooPut,
  wooGetAll,
} from './lib/woo-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DRY_RUN = parseArgFlag('--dry-run')
const UPDATE = parseArgFlag('--update')
const SKIP_IMAGES = parseArgFlag('--skip-images')
const LIMIT = Number(parseArgValue('--limit', '0')) || 0
const ONLY_HANDLE = parseArgValue('--handle', '') || ''

const SHOPIFY_META_KEY = '_shopify_product_id'
const SHOPIFY_HANDLE_META = '_shopify_handle'

const PRODUCTS_QUERY = `
  query ImportProducts($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          status
          descriptionHtml
          productType
          vendor
          tags
          featuredImage { url altText }
          images(first: 10) { edges { node { url altText } } }
          variants(first: 50) {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function shopifyNumericId(gid) {
  const m = String(gid).match(/Product\/(\d+)/)
  return m ? m[1] : String(gid)
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchAllShopifyProducts() {
  const products = []
  let cursor = null
  for (;;) {
    const data = await adminGraphql(PRODUCTS_QUERY, { cursor })
    const conn = data.products
    for (const edge of conn.edges) {
      products.push(edge.node)
    }
    if (!conn.pageInfo.hasNextPage) break
    cursor = conn.pageInfo.endCursor
    await sleep(250)
  }
  return products
}

function mapShopifyToWoo(node, categoryIdByName) {
  const variants = (node.variants?.edges || []).map((e) => e.node)
  const first = variants[0] || {}
  const shopifyId = shopifyNumericId(node.id)
  const images = SKIP_IMAGES
    ? []
    : (node.images?.edges || [])
        .map((e) => e.node?.url)
        .filter(Boolean)
        .map((src, i) => ({
          src,
          alt: node.title,
          position: i + 1,
        }))

  if (images.length === 0 && node.featuredImage?.url && !SKIP_IMAGES) {
    images.push({ src: node.featuredImage.url, alt: node.title, position: 1 })
  }

  const categories = []
  if (node.productType) {
    const cid = categoryIdByName.get(node.productType.toLowerCase())
    if (cid) categories.push({ id: cid })
  }

  const status = node.status === 'ACTIVE' ? 'publish' : 'draft'
  const qty = first.inventoryQuantity
  const manageStock = typeof qty === 'number'

  return {
    shopifyId,
    handle: node.handle,
    payload: {
      name: node.title,
      slug: node.handle,
      type: 'simple',
      status,
      description: node.descriptionHtml || '',
      short_description: stripHtml(node.descriptionHtml).slice(0, 280),
      // Always unique in Woo — Shopify SKUs often collide across products/variants
      sku: `shopify-${shopifyId}`,
      regular_price: first.price != null ? String(first.price) : '',
      sale_price:
        first.compareAtPrice && Number(first.compareAtPrice) > Number(first.price || 0)
          ? String(first.price)
          : '',
      manage_stock: manageStock,
      stock_quantity: manageStock ? qty : undefined,
      stock_status:
        first.availableForSale === false
          ? 'outofstock'
          : manageStock && qty <= 0
            ? 'outofstock'
            : 'instock',
      categories,
      tags: (node.tags || []).slice(0, 20).map((name) => ({ name })),
      images,
      meta_data: [
        { key: SHOPIFY_META_KEY, value: shopifyId },
        { key: SHOPIFY_HANDLE_META, value: node.handle },
        { key: '_shopify_vendor', value: node.vendor || '' },
        { key: '_shopify_gid', value: node.id },
        { key: '_shopify_sku_original', value: first.sku || '' },
      ],
    },
  }
}

async function ensureCategories(productTypes) {
  const existing = await wooGetAll('/products/categories', { per_page: 100 })
  const byName = new Map(existing.map((c) => [c.name.toLowerCase(), c.id]))
  const bySlug = new Map(existing.map((c) => [c.slug, c.id]))

  for (const name of productTypes) {
    if (!name) continue
    const key = name.toLowerCase()
    if (byName.has(key)) continue
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'uncategorized'
    if (bySlug.has(slug)) {
      byName.set(key, bySlug.get(slug))
      continue
    }
    if (DRY_RUN) {
      console.log(`[dry-run] would create category: ${name}`)
      byName.set(key, -1)
      continue
    }
    try {
      const created = await wooPost('/products/categories', { name, slug })
      byName.set(key, created.id)
      bySlug.set(created.slug, created.id)
      console.log(`category created: ${name} (#${created.id})`)
      await sleep(200)
    } catch (err) {
      console.warn(`category fail ${name}:`, err.message)
    }
  }
  return byName
}

async function indexExistingWooProducts() {
  const list = await wooGetAll('/products', { per_page: 100, status: 'any' })
  const byShopifyId = new Map()
  const bySlug = new Map()
  for (const p of list) {
    bySlug.set(p.slug, p)
    const meta = (p.meta_data || []).find((m) => m.key === SHOPIFY_META_KEY)
    if (meta?.value) byShopifyId.set(String(meta.value), p)
  }
  // Enrich missing meta via single GET only when needed later
  return { byShopifyId, bySlug, list }
}

async function main() {
  loadShopifyEnv(ROOT)
  loadWooEnv(ROOT)

  const shopCfg = getShopifyAdminConfig()
  assertAdminConfig({ store: shopCfg.store, dryRun: false })
  getWooConfig()

  const token = await resolveAdminAccessToken(shopCfg)
  if (!token) throw new Error('No Shopify Admin token')

  console.log(`Shopify store: ${shopCfg.store}`)
  console.log(`Woo base: ${process.env.WORDPRESS_BASE_URL}`)
  console.log(
    `mode: ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}${UPDATE ? ' +UPDATE' : ''} limit=${LIMIT || 'all'} skipImages=${SKIP_IMAGES}`,
  )

  let shopifyProducts = await fetchAllShopifyProducts()
  if (ONLY_HANDLE) {
    shopifyProducts = shopifyProducts.filter((p) => p.handle === ONLY_HANDLE)
  }
  // Prefer active first
  shopifyProducts.sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'ACTIVE' ? -1 : 1
  })
  if (LIMIT > 0) shopifyProducts = shopifyProducts.slice(0, LIMIT)

  console.log(`Shopify products selected: ${shopifyProducts.length}`)

  const types = [...new Set(shopifyProducts.map((p) => p.productType).filter(Boolean))]
  const categoryIdByName = DRY_RUN
    ? new Map(types.map((t) => [t.toLowerCase(), -1]))
    : await ensureCategories(types)

  const index = DRY_RUN
    ? { byShopifyId: new Map(), bySlug: new Map(), list: [] }
    : await indexExistingWooProducts()

  const report = {
    dryRun: DRY_RUN,
    selected: shopifyProducts.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    items: [],
  }

  for (const node of shopifyProducts) {
    const mapped = mapShopifyToWoo(node, categoryIdByName)
    // drop invalid category placeholders from dry-run
    mapped.payload.categories = (mapped.payload.categories || []).filter((c) => c.id > 0)
    if (mapped.payload.sale_price && mapped.payload.regular_price) {
      // if sale_price set wrongly when compareAt is higher, fix: regular = compareAt, sale = price
      const v0 = node.variants?.edges?.[0]?.node
      if (v0?.compareAtPrice && Number(v0.compareAtPrice) > Number(v0.price || 0)) {
        mapped.payload.regular_price = String(v0.compareAtPrice)
        mapped.payload.sale_price = String(v0.price)
      } else {
        delete mapped.payload.sale_price
      }
    } else {
      delete mapped.payload.sale_price
    }

    const existing =
      index.byShopifyId.get(mapped.shopifyId) || index.bySlug.get(mapped.handle) || null

    if (existing && !UPDATE && !DRY_RUN) {
      report.skipped++
      report.items.push({ handle: mapped.handle, action: 'skip_exists', wooId: existing.id })
      continue
    }

    if (DRY_RUN) {
      const action = existing && UPDATE ? 'would_update' : existing ? 'would_skip_exists' : 'would_create'
      report.items.push({
        handle: mapped.handle,
        action,
        title: node.title,
        price: mapped.payload.regular_price,
        sku: mapped.payload.sku,
      })
      if (action === 'would_create') report.created++
      else if (action === 'would_update') report.updated++
      else report.skipped++
      console.log(`[dry-run] ${action}: ${mapped.handle} (${mapped.payload.regular_price} EUR)`)
      continue
    }

    try {
      if (existing && UPDATE) {
        const updated = await wooPut(`/products/${existing.id}`, mapped.payload)
        report.updated++
        report.items.push({ handle: mapped.handle, action: 'updated', wooId: updated.id })
        console.log(`updated: ${mapped.handle} → #${updated.id}`)
      } else if (!existing) {
        let created
        try {
          created = await wooPost('/products', mapped.payload)
        } catch (postErr) {
          const postMsg = postErr instanceof Error ? postErr.message : String(postErr)
          // Retry once with empty SKU if Woo still complains (edge cases)
          if (postMsg.includes('product_invalid_sku')) {
            mapped.payload.sku = `shopify-${mapped.shopifyId}-${Date.now().toString(36).slice(-4)}`
            created = await wooPost('/products', mapped.payload)
          } else {
            throw postErr
          }
        }
        report.created++
        report.items.push({ handle: mapped.handle, action: 'created', wooId: created.id })
        console.log(`created: ${mapped.handle} → #${created.id}`)
      }
      await sleep(350)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      report.errors.push({ handle: mapped.handle, error: msg.slice(0, 500) })
      console.error(`error ${mapped.handle}:`, msg.slice(0, 200))
      await sleep(500)
    }
  }

  const reportPath = join(ROOT, 'IMPORT_SHOPIFY_TO_WOO_REPORT.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log('\n=== Summary ===')
  console.log(JSON.stringify({
    dryRun: report.dryRun,
    selected: report.selected,
    created: report.created,
    updated: report.updated,
    skipped: report.skipped,
    errors: report.errors.length,
    report: reportPath,
  }, null, 2))

  if (report.errors.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
