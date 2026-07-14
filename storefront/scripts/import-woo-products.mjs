#!/usr/bin/env node
/**
 * Import GrowMedica products into WooCommerce.
 * Usage: node scripts/import-woo-products.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, wooPost, wooGet } from './lib/woo-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

loadEnvLocal(ROOT)

const products = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/woo-import-products.json'), 'utf8'),
)

async function main() {
  const report = { created: 0, skipped: 0, errors: [] }

  if (DRY_RUN) {
    report.created = products.length
    const reportPath = join(ROOT, 'IMPORT_REPORT.md')
    writeFileSync(reportPath, `# Import Report — Products (dry-run)\n\n- Would create: ${report.created}\n`)
    console.log(`Dry-run: would import ${report.created} products`)
    return
  }

  const categories = await wooGet('/products/categories', { per_page: 100 })
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]))
  const existingProducts = await wooGet('/products', { per_page: 100, status: 'any' })
  const bySlug = new Map(existingProducts.map((p) => [p.slug, p]))

  for (const product of products) {
    if (bySlug.has(product.slug)) {
      report.skipped++
      continue
    }

    const categoryId = catBySlug.get(product.category)
    if (!categoryId) {
      report.errors.push({ slug: product.slug, error: `Category ${product.category} not found` })
      continue
    }

    const payload = {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      regular_price: product.regular_price,
      description: product.description,
      short_description: product.short_description,
      status: 'publish',
      manage_stock: true,
      stock_quantity: product.stock_quantity,
      categories: [{ id: categoryId }],
    }

    if (DRY_RUN) {
      report.created++
      continue
    }

    try {
      await wooPost('/products', payload)
      report.created++
    } catch (error) {
      report.errors.push({ slug: product.slug, error: String(error) })
    }
  }

  const reportPath = join(ROOT, 'IMPORT_REPORT.md')
  const section = `\n## Products\n\n- Created: ${report.created}\n- Skipped: ${report.skipped}\n- Errors: ${report.errors.length}\n`
  if (existsSync(reportPath)) {
    appendFileSync(reportPath, section)
  } else {
    writeFileSync(reportPath, `# Import Report${section}`)
  }
  console.log(section)
  if (report.errors.length) {
    console.error(report.errors)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
