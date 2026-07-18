#!/usr/bin/env node
/**
 * Assign featured images to balicek-* products that have empty galleries.
 * Strategy: reuse an existing Woo product image (same Media Library attachment)
 * matched by category/keyword search — no external CDN, no Shopify.
 *
 * Env: WORDPRESS_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET
 *   (storefront/.env.local or exported from load-wp-prod-env.sh)
 *
 * Usage:
 *   node scripts/assign-bundle-images.mjs --dry-run
 *   node scripts/assign-bundle-images.mjs
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, wooGet, wooGetAll, wooPut } from './lib/woo-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
loadEnvLocal(ROOT)

// Also allow parent monorepo production env without printing secrets
try {
  const { existsSync, readFileSync } = await import('node:fs')
  const prodEnv = join(ROOT, '..', 'wordpress-production.local.env')
  if (existsSync(prodEnv)) {
    for (const line of readFileSync(prodEnv, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#') || !t.includes('=')) continue
      const eq = t.indexOf('=')
      const k = t.slice(0, eq).trim()
      let v = t.slice(eq + 1).trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      if (k && v && !process.env[k]) process.env[k] = v
    }
  }
} catch {
  /* ignore */
}

const dryRun = process.argv.includes('--dry-run')

/** Search queries preferred first → fallback (Woo product search). */
const BUNDLE_IMAGE_QUERIES = {
  'balicek-imunitny-stit-basic': ['vitamin c', 'imunita', 'zinok'],
  'balicek-imunitny-stit-plus': ['probiot', 'purebiom', 'vitamin d3', 'imunita'],
  'balicek-pokojny-vecer': ['melatonin', 'magnesium', 'spanok'],
  'balicek-anti-stres-den': ['mystress', 'ashwagandha', 'stres'],
  'balicek-hlboky-spanok': ['melatonin', 'valeriana', 'spanok'],
  'balicek-starter-fitness': ['whey', 'protein', 'bcaa', 'amino'],
  'balicek-silovy-trenink': ['kreatin', 'creatine', 'whey', 'protein'],
  'balicek-regeneracia-po-treninku': ['protein', 'whey', 'omega-3', 'magnesium'],
  'balicek-klby-basic': ['glukosamin', 'klby', 'msm'],
  'balicek-srdce-basic': ['omega', 'coq10', 'srdce'],
  'balicek-crevna-rovnovaha': ['probiot', 'travenie', 'inulin'],
  'balicek-krasa-zvnutra': ['kolagen', 'biotin', 'krasa'],
  'balicek-denny-zaklad': ['multivitamin', 'vitamin d', 'omega'],
  'balicek-focus-mozog': ['lion', 'hericium', 'omega'],
  'balicek-growmedica-komplet': ['multivitamin', 'kompletn', 'vitamin'],
}

function pickImage(product) {
  const img = product?.images?.[0]
  if (!img?.id || !img?.src) return null
  return { id: img.id, src: img.src, from: product.slug }
}

async function findImageForQueries(queries, catalog) {
  for (const q of queries) {
    const qLower = q.toLowerCase()
    // Prefer in-memory catalog match (faster, no extra API)
    const hit = catalog.find((p) => {
      if (!p.images?.length) return false
      if (String(p.slug || '').startsWith('balicek-')) return false
      const hay = `${p.name} ${p.slug}`.toLowerCase()
      return hay.includes(qLower)
    })
    if (hit) return pickImage(hit)

    // API search fallback
    try {
      const results = await wooGet('/products', {
        search: q,
        per_page: 10,
        status: 'publish',
      })
      for (const p of results) {
        if (String(p.slug || '').startsWith('balicek-')) continue
        const img = pickImage(p)
        if (img) return img
      }
    } catch {
      /* continue */
    }
  }
  return null
}

async function main() {
  console.log(`Assign bundle images${dryRun ? ' (dry-run)' : ''}…`)

  const catalog = await wooGetAll('/products', { status: 'publish', per_page: 100 })
  const bundles = catalog.filter(
    (p) => String(p.slug || '').startsWith('balicek-') && !(p.images && p.images.length),
  )

  console.log(`Catalog products: ${catalog.length}`)
  console.log(`Bundles without image: ${bundles.length}`)

  // Global fallback: any non-bundle product with image
  const globalFallback = pickImage(
    catalog.find((p) => p.images?.length && !String(p.slug || '').startsWith('balicek-')),
  )

  let ok = 0
  let fail = 0

  for (const bundle of bundles) {
    const queries = BUNDLE_IMAGE_QUERIES[bundle.slug] || [bundle.slug.replace(/^balicek-/, ''), 'vitamin']
    let image = await findImageForQueries(queries, catalog)
    if (!image) image = globalFallback

    if (!image) {
      console.error(`FAIL ${bundle.slug}: no source image found in catalog`)
      fail += 1
      continue
    }

    console.log(
      `${dryRun ? '[dry-run] ' : ''}SET ${bundle.slug} (id ${bundle.id}) ← media #${image.id} from ${image.from}`,
    )
    console.log(`         ${image.src}`)

    if (!dryRun) {
      try {
        // Reuse existing media attachment ID (already on cms.growmedica.cz)
        await wooPut(`/products/${bundle.id}`, {
          images: [{ id: image.id }],
        })
        ok += 1
      } catch (err) {
        console.error(`FAIL ${bundle.slug}:`, err.message)
        fail += 1
      }
    } else {
      ok += 1
    }
  }

  console.log(`Done. ok=${ok} fail=${fail}${dryRun ? ' (dry-run — no writes)' : ''}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
