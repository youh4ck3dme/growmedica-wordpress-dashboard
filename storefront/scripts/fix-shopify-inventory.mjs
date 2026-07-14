#!/usr/bin/env node
/**
 * Fix "Vypredané" at Shopify checkout — bulk inventory + availability via Admin API.
 *
 * Requires .env.local:
 *   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
 *   SHOPIFY_API_VERSION=2025-01
 *
 * Admin API scopes: read_products, write_products, read_inventory, write_inventory
 *
 * Usage:
 *   node scripts/fix-shopify-inventory.mjs --dry-run
 *   node scripts/fix-shopify-inventory.mjs
 *   node scripts/fix-shopify-inventory.mjs --apply
 *   node scripts/fix-shopify-inventory.mjs --quantity=100
 *   node scripts/fix-shopify-inventory.mjs --handle=mycomedica-bio-coriolus-100-g
 *   node scripts/fix-shopify-inventory.mjs --strategy=untracked
 *   node scripts/fix-shopify-inventory.mjs --limit=5
 *
 * Strategies:
 *   full (default) — inventoryPolicy CONTINUE + untracked + set quantity at primary location
 *   quantity       — set quantity only (keeps tracking)
 *   untracked      — disable inventory tracking (like bundle products)
 *   continue       — inventoryPolicy CONTINUE only
 */

import {
  adminGraphql,
  assertAdminConfig,
  getShopifyAdminConfig,
  loadEnvLocal,
  parseArgFlag,
  parseArgValue,
} from './lib/shopify-admin-client.mjs'

loadEnvLocal()

const config = getShopifyAdminConfig()
const apply = parseArgFlag('--apply')
const dryRun = !apply || parseArgFlag('--dry-run')
const force = parseArgFlag('--force')
const quantity = Math.max(1, Number(parseArgValue('--quantity', '100')) || 100)
const limit = parseArgValue('--limit', null) ? Number(parseArgValue('--limit', '0')) : null
const handleFilter = parseArgValue('--handle', null)
const strategy = parseArgValue('--strategy', 'full')

const VALID_STRATEGIES = new Set(['full', 'quantity', 'untracked', 'continue'])
if (!VALID_STRATEGIES.has(strategy)) {
  console.error(`Invalid --strategy=${strategy}. Use: ${[...VALID_STRATEGIES].join(', ')}`)
  process.exit(1)
}

function availableQty(levelNode) {
  const q = levelNode?.quantities?.find((item) => item.name === 'available')
  return q?.quantity ?? 0
}

async function getPrimaryLocationId() {
  const data = await adminGraphql(
    `query {
      locations(first: 10) {
        edges {
          node {
            id
            name
            isActive
            fulfillsOnlineOrders
          }
        }
      }
    }`,
    {},
    config,
  )

  const locations = data.locations.edges.map((e) => e.node).filter((l) => l.isActive)
  const online =
    locations.find((l) => l.fulfillsOnlineOrders) ??
    locations.find((l) => /shop|sklad|warehouse|default/i.test(l.name)) ??
    locations[0]

  if (!online) throw new Error('No active Shopify location found')
  return online
}

async function fetchAllVariants() {
  const variants = []
  let cursor = null
  let hasNextPage = true
  const queryFilter = handleFilter ? `handle:${handleFilter}` : 'status:active'

  while (hasNextPage) {
    const data = await adminGraphql(
      `query Products($cursor: String, $query: String) {
        products(first: 50, after: $cursor, query: $query) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              handle
              title
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    inventoryPolicy
                    inventoryItem {
                      id
                      tracked
                      inventoryLevels(first: 10) {
                        edges {
                          node {
                            id
                            location { id name }
                            quantities(names: ["available"]) {
                              name
                              quantity
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      { cursor, query: queryFilter },
      config,
    )

    for (const productEdge of data.products.edges) {
      const product = productEdge.node
      for (const variantEdge of product.variants.edges) {
        variants.push({
          productId: product.id,
          productHandle: product.handle,
          productTitle: product.title,
          variantId: variantEdge.node.id,
          variantTitle: variantEdge.node.title,
          inventoryPolicy: variantEdge.node.inventoryPolicy,
          inventoryItemId: variantEdge.node.inventoryItem.id,
          tracked: variantEdge.node.inventoryItem.tracked,
          levels: variantEdge.node.inventoryItem.inventoryLevels.edges.map((e) => e.node),
        })
        if (limit && variants.length >= limit) {
          return variants
        }
      }
    }

    hasNextPage = data.products.pageInfo.hasNextPage
    cursor = data.products.pageInfo.endCursor
    if (limit && variants.length >= limit) break
  }

  return variants
}

function needsFix(variant, locationId) {
  const level = variant.levels.find((l) => l.location.id === locationId)
  const qty = level ? availableQty(level) : 0
  const policyOk = variant.inventoryPolicy === 'CONTINUE'
  const trackedOk = !variant.tracked
  const qtyOk = qty > 0

  switch (strategy) {
    case 'quantity':
      return force || !qtyOk
    case 'untracked':
      return force || !trackedOk
    case 'continue':
      return force || !policyOk
    case 'full':
    default:
      return force || !policyOk || !trackedOk || !qtyOk
  }
}

async function setVariantPolicy(productId, variantId, policy) {
  const data = await adminGraphql(
    `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id inventoryPolicy }
        userErrors { field message }
      }
    }`,
    {
      productId,
      variants: [{ id: variantId, inventoryPolicy: policy }],
    },
    config,
  )
  const errors = data.productVariantsBulkUpdate.userErrors
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '))
}

async function setUntracked(inventoryItemId) {
  const data = await adminGraphql(
    `mutation($id: ID!, $input: InventoryItemInput!) {
      inventoryItemUpdate(id: $id, input: $input) {
        inventoryItem { id tracked }
        userErrors { field message }
      }
    }`,
    { id: inventoryItemId, input: { tracked: false } },
    config,
  )
  const errors = data.inventoryItemUpdate.userErrors
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '))
}

async function activateOrSetQuantity(inventoryItemId, locationId, qty, existingLevel) {
  if (!existingLevel) {
    const data = await adminGraphql(
      `mutation($inventoryItemId: ID!, $locationId: ID!, $available: Int) {
        inventoryActivate(
          inventoryItemId: $inventoryItemId
          locationId: $locationId
          available: $available
        ) {
          inventoryLevel { id }
          userErrors { field message }
        }
      }`,
      { inventoryItemId, locationId, available: qty },
      config,
    )
    const errors = data.inventoryActivate.userErrors
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '))
    return
  }

  const data = await adminGraphql(
    `mutation($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        name: 'available',
        reason: 'correction',
        ignoreCompareQuantity: true,
        quantities: [{ inventoryItemId, locationId, quantity: qty }],
      },
    },
    config,
  )
  const errors = data.inventorySetQuantities.userErrors
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '))
}

async function fixVariant(variant, location) {
  const actions = []

  if (strategy === 'full' || strategy === 'continue') {
    if (variant.inventoryPolicy !== 'CONTINUE') {
      actions.push('policy→CONTINUE')
      if (!dryRun) await setVariantPolicy(variant.productId, variant.variantId, 'CONTINUE')
    }
  }

  if (strategy === 'full' || strategy === 'untracked') {
    if (variant.tracked) {
      actions.push('untracked')
      if (!dryRun) await setUntracked(variant.inventoryItemId)
    }
  }

  if (strategy === 'full' || strategy === 'quantity') {
    const level = variant.levels.find((l) => l.location.id === location.id)
    const currentQty = level ? availableQty(level) : 0
    if (currentQty < quantity) {
      actions.push(`qty→${quantity}`)
      if (!dryRun) {
        await activateOrSetQuantity(variant.inventoryItemId, location.id, quantity, level)
      }
    }
  }

  return actions
}

async function main() {
  const hasToken = assertAdminConfig({ ...config, dryRun })
  if (!hasToken && !dryRun) process.exit(1)

  console.log(`Store: ${config.store ?? '(not set)'}`)
  console.log(
    `Strategy: ${strategy} | quantity: ${quantity}${handleFilter ? ` | handle: ${handleFilter}` : ''}${limit ? ` | limit: ${limit}` : ''}${dryRun ? ' | DRY-RUN' : ' | APPLY'}`,
  )

  if (!hasToken) {
    console.log('\nSet SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local to apply changes.')
    return
  }

  const location = await getPrimaryLocationId()
  console.log(`Primary location: ${location.name} (${location.id})\n`)

  const variants = await fetchAllVariants()
  if (variants.length === 0) {
    console.log('No active product variants found.')
    return
  }

  let fixed = 0
  let skipped = 0

  for (const variant of variants) {
    const label = `${variant.productHandle} / ${variant.variantTitle}`
    if (!needsFix(variant, location.id)) {
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] would fix: ${label}`)
      fixed++
      continue
    }

    try {
      const actions = await fixVariant(variant, location)
      console.log(`fixed: ${label} — ${actions.join(', ') || 'ok'}`)
      fixed++
    } catch (err) {
      console.error(`error: ${label} — ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\nDone. ${fixed} updated, ${skipped} already OK (of ${variants.length} variants).`)
  console.log('Test: add product → /kosik → Prejsť k pokladni (Shopify checkout).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
