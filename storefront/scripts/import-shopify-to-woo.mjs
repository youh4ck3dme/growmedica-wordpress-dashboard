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

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
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
const PREFLIGHT_ONLY = parseArgFlag('--preflight-only')
const TAXONOMY_ONLY = parseArgFlag('--taxonomy-only')
const ENV_FILE = parseArgValue('--env-file', '') || ''
const TAXONOMY_PATH = parseArgValue(
  '--taxonomy',
  join(ROOT, '..', 'reports', 'seo-taxonomy', 'growmedica-seo-menu-tree.json'),
)
const FREEZE_PATH = parseArgValue(
  '--freeze',
  join(ROOT, '..', 'reports', 'seo-taxonomy', 'FREEZE.json'),
)

const SHOPIFY_META_KEY = '_shopify_product_id'
const SHOPIFY_HANDLE_META = '_shopify_handle'
const TAXONOMY_CATEGORY_META = '_growmedica_taxonomy_category_id'
const TAXONOMY_PATH_META = '_growmedica_taxonomy_path'

function loadExplicitEnv(filePath) {
  if (!filePath) return
  const resolvedPath = resolve(process.cwd(), filePath)
  if (!existsSync(resolvedPath)) throw new Error(`Env file not found: ${resolvedPath}`)
  for (const line of readFileSync(resolvedPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
  console.log(`env file: ${resolvedPath}`)
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function loadFrozenTaxonomy() {
  if (!existsSync(TAXONOMY_PATH)) throw new Error(`Taxonomy file not found: ${TAXONOMY_PATH}`)
  if (!existsSync(FREEZE_PATH)) throw new Error(`Freeze manifest not found: ${FREEZE_PATH}`)

  const taxonomy = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'))
  const freeze = JSON.parse(readFileSync(FREEZE_PATH, 'utf8'))
  const expectedHash = freeze.sha256?.['growmedica-seo-menu-tree.json']
  const actualHash = sha256File(TAXONOMY_PATH)
  if (!expectedHash || actualHash !== expectedHash) {
    throw new Error(`Frozen taxonomy hash mismatch: expected ${expectedHash || 'missing'}, got ${actualHash}`)
  }

  const rows = Array.isArray(taxonomy.wooImportProducts) ? taxonomy.wooImportProducts : []
  const ready = rows.filter((row) => row.importStatus === 'READY')
  const hold = rows.filter((row) => row.importStatus === 'HOLD')
  const uniqueHandles = new Set(rows.map((row) => row.handle))
  const categoryIds = new Set((taxonomy.categories || []).map((category) => category.categoryId))
  const invalidReady = ready.filter(
    (row) => !row.handle || !row.proposedPrimaryCategoryId || !categoryIds.has(row.proposedPrimaryCategoryId),
  )
  const expectedReady = Number(freeze.counts?.ready)
  const expectedHold = Number(freeze.counts?.hold)

  if (
    rows.length !== uniqueHandles.size ||
    ready.length !== expectedReady ||
    hold.length !== expectedHold ||
    invalidReady.length > 0
  ) {
    throw new Error(
      `Taxonomy gate failed: rows=${rows.length} unique=${uniqueHandles.size} ready=${ready.length}/${expectedReady} hold=${hold.length}/${expectedHold} invalidReady=${invalidReady.length}`,
    )
  }

  return {
    taxonomy,
    freeze,
    actualHash,
    ready,
    hold,
    readyByHandle: new Map(ready.map((row) => [row.handle, row])),
    allByHandle: new Map(rows.map((row) => [row.handle, row])),
  }
}

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

function mapShopifyToWoo(node, categoryIdByTaxonomy, taxonomyRow) {
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
  const taxonomyCategoryId = taxonomyRow.proposedPrimaryCategoryId
  const wooCategoryId = categoryIdByTaxonomy.get(taxonomyCategoryId)
  if (wooCategoryId) categories.push({ id: wooCategoryId })

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
        { key: TAXONOMY_CATEGORY_META, value: taxonomyCategoryId },
        { key: TAXONOMY_PATH_META, value: taxonomyRow.proposedPrimaryCategoryPath },
      ],
    },
  }
}

function taxonomyCategorySlug(category) {
  return category.slugs?.sk || category.segment || category.categoryId
}

function collectRequiredCategories(taxonomy, readyRows) {
  const byId = new Map((taxonomy.categories || []).map((category) => [category.categoryId, category]))
  const required = new Set(readyRows.map((row) => row.proposedPrimaryCategoryId))
  for (const categoryId of [...required]) {
    let cursor = byId.get(categoryId)
    while (cursor?.parentId) {
      required.add(cursor.parentId)
      cursor = byId.get(cursor.parentId)
    }
  }
  return [...required]
    .map((categoryId) => byId.get(categoryId))
    .filter(Boolean)
    .sort((a, b) => a.depth - b.depth || a.sourcePath.localeCompare(b.sourcePath, 'sk'))
}

async function ensureTaxonomyCategories(taxonomy, readyRows) {
  const existing = await wooGetAll('/products/categories', { per_page: 100 })
  const byParentAndSlug = new Map(existing.map((category) => [`${category.parent || 0}:${category.slug}`, category.id]))
  const byParentAndName = new Map(
    existing.map((category) => [`${category.parent || 0}:${String(category.name).trim().toLocaleLowerCase('sk')}`, category.id]),
  )
  const categoryIdToWooId = new Map()
  const required = collectRequiredCategories(taxonomy, readyRows)
  const created = []
  const reused = []

  for (const category of required) {
    const parentWooId = category.parentId ? categoryIdToWooId.get(category.parentId) : 0
    if (category.parentId && parentWooId == null) {
      throw new Error(`Missing Woo parent mapping for ${category.categoryId} (${category.sourcePath})`)
    }
    const slug = taxonomyCategorySlug(category)
    const key = `${parentWooId || 0}:${slug}`
    const name = category.labels?.sk || category.segment
    const nameKey = `${parentWooId || 0}:${String(name).trim().toLocaleLowerCase('sk')}`
    // WordPress term slugs are globally unique and may be suffixed automatically.
    // Parent + display name remains stable for this frozen hierarchy.
    const existingId = byParentAndName.get(nameKey) || byParentAndSlug.get(key)
    if (existingId) {
      categoryIdToWooId.set(category.categoryId, existingId)
      reused.push({ categoryId: category.categoryId, wooId: existingId, path: category.sourcePath })
      continue
    }
    if (DRY_RUN) {
      const fakeId = -(created.length + 1)
      categoryIdToWooId.set(category.categoryId, fakeId)
      created.push({ categoryId: category.categoryId, wooId: fakeId, path: category.sourcePath, parentWooId, slug })
      console.log(`[dry-run] would create category: ${category.sourcePath}`)
      continue
    }
    try {
      const createdCategory = await wooPost('/products/categories', {
        name,
        slug,
        parent: parentWooId || 0,
      })
      categoryIdToWooId.set(category.categoryId, createdCategory.id)
      byParentAndSlug.set(`${createdCategory.parent || 0}:${createdCategory.slug}`, createdCategory.id)
      byParentAndName.set(
        `${createdCategory.parent || 0}:${String(createdCategory.name).trim().toLocaleLowerCase('sk')}`,
        createdCategory.id,
      )
      created.push({ categoryId: category.categoryId, wooId: createdCategory.id, path: category.sourcePath, parentWooId, slug: createdCategory.slug })
      console.log(`category created: ${category.sourcePath} (#${createdCategory.id})`)
      await sleep(200)
    } catch (err) {
      throw new Error(`Category create failed for ${category.sourcePath}: ${err.message}`)
    }
  }
  return { categoryIdToWooId, created, reused, requiredCount: required.length }
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

async function runTaxonomyOnly(taxonomyGate) {
  const index = await indexExistingWooProducts()
  const missingReady = taxonomyGate.ready.filter((row) => !index.bySlug.has(row.handle))
  if (missingReady.length) {
    throw new Error(
      `Woo taxonomy import blocked: ${missingReady.length} READY handles are missing in Woo (${missingReady.slice(0, 10).map((row) => row.handle).join(', ')})`,
    )
  }

  const categoryPlan = await ensureTaxonomyCategories(taxonomyGate.taxonomy, taxonomyGate.ready)
  const report = {
    mode: 'taxonomy-only',
    dryRun: DRY_RUN,
    taxonomySha256: taxonomyGate.actualHash,
    ready: taxonomyGate.ready.length,
    hold: taxonomyGate.hold.length,
    wooProductsFound: index.list.length,
    categoriesRequired: categoryPlan.requiredCount,
    categoriesExisting: categoryPlan.reused.length,
    categoriesCreated: DRY_RUN ? 0 : categoryPlan.created.length,
    categoriesWouldCreate: DRY_RUN ? categoryPlan.created.length : 0,
    productsUpdated: 0,
    productsWouldUpdate: 0,
    productsUnchanged: 0,
    wooProductStatuses: Object.fromEntries(
      [...new Set(index.list.map((product) => product.status))]
        .sort()
        .map((status) => [status, index.list.filter((product) => product.status === status).length]),
    ),
    errors: [],
    items: [],
  }

  for (const row of taxonomyGate.ready) {
    const existing = index.bySlug.get(row.handle)
    const categoryId = categoryPlan.categoryIdToWooId.get(row.proposedPrimaryCategoryId)
    if (!categoryId) {
      report.errors.push({ handle: row.handle, error: `Missing category mapping ${row.proposedPrimaryCategoryId}` })
      continue
    }
    const metaByKey = new Map((existing.meta_data || []).map((meta) => [meta.key, String(meta.value)]))
    const existingCategoryIds = (existing.categories || []).map((category) => Number(category.id))
    const taxonomyIsCurrent =
      categoryId > 0 &&
      existingCategoryIds.length === 1 &&
      existingCategoryIds[0] === categoryId &&
      metaByKey.get(TAXONOMY_CATEGORY_META) === row.proposedPrimaryCategoryId &&
      metaByKey.get(TAXONOMY_PATH_META) === row.proposedPrimaryCategoryPath &&
      metaByKey.get('_growmedica_taxonomy_sha256') === taxonomyGate.actualHash
    if (taxonomyIsCurrent) {
      report.productsUnchanged++
      report.items.push({
        handle: row.handle,
        wooId: existing.id,
        action: 'taxonomy_unchanged',
        categoryId: row.proposedPrimaryCategoryId,
        categoryPath: row.proposedPrimaryCategoryPath,
      })
      continue
    }
    if (DRY_RUN) {
      report.productsWouldUpdate++
      report.items.push({
        handle: row.handle,
        wooId: existing.id,
        action: 'would_update_taxonomy',
        categoryId: row.proposedPrimaryCategoryId,
        categoryPath: row.proposedPrimaryCategoryPath,
      })
      continue
    }

    try {
      await wooPut(`/products/${existing.id}`, {
        categories: [{ id: categoryId }],
        meta_data: [
          { key: TAXONOMY_CATEGORY_META, value: row.proposedPrimaryCategoryId },
          { key: TAXONOMY_PATH_META, value: row.proposedPrimaryCategoryPath },
          { key: '_growmedica_taxonomy_sha256', value: taxonomyGate.actualHash },
        ],
      })
      report.productsUpdated++
      report.items.push({
        handle: row.handle,
        wooId: existing.id,
        action: 'updated_taxonomy',
        categoryId: row.proposedPrimaryCategoryId,
        categoryPath: row.proposedPrimaryCategoryPath,
      })
      await sleep(200)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      report.errors.push({ handle: row.handle, error: message.slice(0, 500) })
    }
  }

  const reportPath = join(ROOT, 'IMPORT_SHOPIFY_TO_WOO_REPORT.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({
    mode: report.mode,
    dryRun: report.dryRun,
    ready: report.ready,
    hold: report.hold,
    wooProductsFound: report.wooProductsFound,
    categoriesRequired: report.categoriesRequired,
    categoriesExisting: report.categoriesExisting,
    categoriesCreated: report.categoriesCreated,
    categoriesWouldCreate: report.categoriesWouldCreate,
    productsUpdated: report.productsUpdated,
    productsWouldUpdate: report.productsWouldUpdate,
    productsUnchanged: report.productsUnchanged,
    wooProductStatuses: report.wooProductStatuses,
    errors: report.errors.length,
    report: reportPath,
  }, null, 2))
  if (report.errors.length) process.exitCode = 1
}

async function main() {
  loadExplicitEnv(ENV_FILE)
  const taxonomyGate = loadFrozenTaxonomy()
  console.log(`taxonomy: ${TAXONOMY_PATH}`)
  console.log(`taxonomy sha256: ${taxonomyGate.actualHash}`)
  console.log(`taxonomy gate: READY=${taxonomyGate.ready.length} HOLD=${taxonomyGate.hold.length}`)

  if (PREFLIGHT_ONLY) {
    console.log(JSON.stringify({
      frozenAt: taxonomyGate.freeze.frozenAt,
      schemaVersion: taxonomyGate.taxonomy.schemaVersion,
      ready: taxonomyGate.ready.length,
      hold: taxonomyGate.hold.length,
      holdHandles: taxonomyGate.hold.map((row) => row.handle),
      categories: taxonomyGate.taxonomy.categories.length,
    }, null, 2))
    return
  }


  if (TAXONOMY_ONLY) {
    loadWooEnv(ROOT)
    getWooConfig()
    await runTaxonomyOnly(taxonomyGate)
    return
  }

  loadShopifyEnv(ROOT)
  loadWooEnv(ROOT)

  const shopCfg = getShopifyAdminConfig()
  assertAdminConfig({ store: shopCfg.store, dryRun: false })
  getWooConfig()

  const token = await resolveAdminAccessToken(shopCfg)
  if (!token) throw new Error('No Shopify Admin token')

  console.log(`Shopify store: ${shopCfg.store}`)
  console.log(`Woo base: ${process.env.WORDPRESS_BASE_URL}`)
  console.log(`mode: ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}${UPDATE ? ' +UPDATE' : ''} limit=${LIMIT || 'all'} skipImages=${SKIP_IMAGES}`)

  let shopifyProducts = await fetchAllShopifyProducts()
  shopifyProducts = shopifyProducts.filter((product) => product.status === 'ACTIVE')
  const fetchedHandles = new Set(shopifyProducts.map((product) => product.handle))
  const taxonomyMissingInShopify = taxonomyGate.ready.filter((row) => !fetchedHandles.has(row.handle))
  const shopifyMissingInTaxonomy = shopifyProducts.filter((product) => !taxonomyGate.allByHandle.has(product.handle))
  if (taxonomyMissingInShopify.length || shopifyMissingInTaxonomy.length) {
    throw new Error(
      `Live catalog drift: READY missing in Shopify=${taxonomyMissingInShopify.length}, Shopify missing in frozen taxonomy=${shopifyMissingInTaxonomy.length}`,
    )
  }
  shopifyProducts = shopifyProducts.filter((product) => taxonomyGate.readyByHandle.has(product.handle))
  if (ONLY_HANDLE) {
    shopifyProducts = shopifyProducts.filter((p) => p.handle === ONLY_HANDLE)
    if (!taxonomyGate.readyByHandle.has(ONLY_HANDLE)) {
      throw new Error(`Requested handle is not READY in frozen taxonomy: ${ONLY_HANDLE}`)
    }
  }
  // Prefer active first
  shopifyProducts.sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'ACTIVE' ? -1 : 1
  })
  if (LIMIT > 0) shopifyProducts = shopifyProducts.slice(0, LIMIT)

  console.log(`Shopify products selected: ${shopifyProducts.length}`)

  const categoryPlan = await ensureTaxonomyCategories(
    taxonomyGate.taxonomy,
    shopifyProducts.map((product) => taxonomyGate.readyByHandle.get(product.handle)),
  )
  const index = await indexExistingWooProducts()

  const report = {
    dryRun: DRY_RUN,
    selected: shopifyProducts.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    items: [],
    taxonomy: {
      sha256: taxonomyGate.actualHash,
      ready: taxonomyGate.ready.length,
      hold: taxonomyGate.hold.length,
      categoriesRequired: categoryPlan.requiredCount,
      categoriesExisting: categoryPlan.reused.length,
      categoriesToCreate: categoryPlan.created.length,
    },
  }

  for (const node of shopifyProducts) {
    const taxonomyRow = taxonomyGate.readyByHandle.get(node.handle)
    const mapped = mapShopifyToWoo(node, categoryPlan.categoryIdToWooId, taxonomyRow)
    if (!DRY_RUN && mapped.payload.categories.length !== 1) {
      throw new Error(`Missing live Woo category mapping for READY product ${node.handle}`)
    }
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
        taxonomyCategoryId: taxonomyRow.proposedPrimaryCategoryId,
        taxonomyPath: taxonomyRow.proposedPrimaryCategoryPath,
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
    taxonomy: report.taxonomy,
    report: reportPath,
  }, null, 2))

  if (report.errors.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
