#!/usr/bin/env node
/**
 * Import GrowMedica categories into WooCommerce.
 * Usage: node scripts/import-woo-categories.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, wooPost, wooGet } from './lib/woo-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

loadEnvLocal(ROOT)

const categories = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/woo-categories.json'), 'utf8'),
)

async function main() {
  const report = { created: 0, skipped: 0, errors: [], categories: [] }

  if (DRY_RUN) {
    for (const cat of categories) {
      report.created++
      report.categories.push({ slug: cat.slug, status: 'dry-run' })
    }
    const reportPath = join(ROOT, 'IMPORT_REPORT.md')
    const md = `# Import Report — Categories (dry-run)\n\n- Would create: ${report.created}\n\n${report.categories.map((c) => `- ${c.slug}: ${c.status}`).join('\n')}\n`
    writeFileSync(reportPath, md)
    console.log(md)
    return
  }

  const existing = await wooGet('/products/categories', { per_page: 100 })
  const bySlug = new Map(existing.map((c) => [c.slug, c]))

  for (const cat of categories) {
    if (bySlug.has(cat.slug)) {
      report.skipped++
      report.categories.push({ slug: cat.slug, status: 'exists', id: bySlug.get(cat.slug).id })
      continue
    }

    if (DRY_RUN) {
      report.created++
      report.categories.push({ slug: cat.slug, status: 'dry-run' })
      continue
    }

    try {
      const created = await wooPost('/products/categories', {
        name: cat.title,
        slug: cat.slug,
        description: cat.description,
      })
      report.created++
      report.categories.push({ slug: cat.slug, status: 'created', id: created.id })
    } catch (error) {
      report.errors.push({ slug: cat.slug, error: String(error) })
    }
  }

  const reportPath = join(ROOT, 'IMPORT_REPORT.md')
  const md = `# Import Report — Categories\n\n- Created: ${report.created}\n- Skipped: ${report.skipped}\n- Errors: ${report.errors.length}\n\n${report.categories.map((c) => `- ${c.slug}: ${c.status}${c.id ? ` (id ${c.id})` : ''}`).join('\n')}\n`
  writeFileSync(reportPath, md)
  console.log(md)
  if (report.errors.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
