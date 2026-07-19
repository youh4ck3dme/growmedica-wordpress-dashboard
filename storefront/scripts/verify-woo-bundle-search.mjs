#!/usr/bin/env node
/**
 * Verify that getWooBundleProducts()'s search strategy (search: 'balicek')
 * actually finds bundle products created by create-woo-bundles.mjs.
 * Mirrors src/lib/wordpress/products.ts#getWooBundleProducts.
 *
 * Usage: node scripts/verify-woo-bundle-search.mjs
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, wooGet } from './lib/woo-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
loadEnvLocal(ROOT)

async function main() {
  const bySearch = await wooGet('/products', { search: 'balicek', per_page: 50, orderby: 'title', order: 'asc' })
  const bundleHandles = bySearch.filter((p) => p.slug?.startsWith('balicek-'))

  console.log(`search=balicek → ${bySearch.length} products, ${bundleHandles.length} with slug prefix "balicek-"`)
  for (const p of bundleHandles) {
    console.log(`  ✓ ${p.slug} — ${p.name} — ${p.price ?? p.regular_price} EUR`)
  }

  if (bundleHandles.length === 0) {
    console.error(
      '\nNo bundle products found via text search. getWooBundleProducts() will show nothing on /balicky.\n' +
        'Fix: change getWooBundleProducts() in src/lib/wordpress/products.ts to filter by slug prefix or tag instead of free-text search.',
    )
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
