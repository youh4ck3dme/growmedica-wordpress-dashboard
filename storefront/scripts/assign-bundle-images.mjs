#!/usr/bin/env node
/**
 * Upload curated bundle product shots from public/images/balicky/ into the
 * WordPress Media Library and set them as featured images on balicek-* products.
 *
 * Local files (slug-based, preferred webp/jpg):
 *   public/images/balicky/{slug}.jpg  (used for WP upload — broadest compatibility)
 *   public/images/balicky/{slug}.webp (used by Next.js storefront)
 *
 * Env (storefront/.env.local and/or wordpress-production.local.env):
 *   WORDPRESS_BASE_URL
 *   WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET   (product updates)
 *   WORDPRESS_ADMIN_USER (or WP_ADMIN_USER)
 *   WORDPRESS_APP_PASSWORD (or WORDPRESS_APPLICATION_PASSWORD)
 *
 * Usage:
 *   node scripts/assign-bundle-images.mjs --dry-run
 *   node scripts/assign-bundle-images.mjs --prod --dry-run
 *   node scripts/assign-bundle-images.mjs --prod
 *   node scripts/assign-bundle-images.mjs --prod --force   # replace existing featured image
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, wooGet, wooPut } from './lib/woo-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const IMAGES_DIR = join(ROOT, 'public', 'images', 'balicky')

const dryRun = process.argv.includes('--dry-run')
const force = process.argv.includes('--force')
const useProd = process.argv.includes('--prod')

function loadEnvFile(filePath, { overwrite = false } = {}) {
  if (!existsSync(filePath)) return false
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
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
    if (k && v && (overwrite || !process.env[k])) process.env[k] = v
  }
  return true
}

// Default: storefront .env.local, then fill gaps from production env.
// --prod: prefer wordpress-production.local.env (cms.growmedica.cz).
if (useProd) {
  const prodEnv = join(ROOT, '..', 'wordpress-production.local.env')
  if (!loadEnvFile(prodEnv, { overwrite: true })) {
    throw new Error(`--prod requires ${prodEnv}`)
  }
  loadEnvLocal(ROOT) // fill any missing non-prod keys without overwriting
} else {
  loadEnvLocal(ROOT)
  loadEnvFile(join(ROOT, '..', 'wordpress-production.local.env'), { overwrite: false })
}

/**
 * Curated mapping: catalog slug → display name (for alt/title).
 * File path: public/images/balicky/{slug}.jpg
 */
const BUNDLE_SHOTS = {
  // batch 1
  'imunitny-stit-basic': 'Imunitný Štít Basic',
  'imunitny-stit-plus': 'Imunitný Štít Plus',
  'pokojny-vecer': 'Pokojný večer',
  'anti-stres-den': 'Anti-stres deň',
  'hlboky-spanok': 'Hlboký spánok',
  'starter-fitness': 'Štartér fitness',
  'silovy-trenink': 'Silový tréning',
  'regeneracia-po-treninku': 'Regenerácia po tréningu',
  'klby-basic': 'Kĺby Basic',
  'srdce-basic': 'Srdce Basic',
  'crevna-rovnovaha': 'Črevná rovnováha',
  'krasa-zvnutra': 'Krása zvnútra',
  'denny-zaklad': 'Denný základ',
  'focus-mozog': 'Focus & mozog',
  'growmedica-komplet': 'GrowMedica Komplet',
  // batch 2
  'imunita-jesen-zima': 'Imunita na jeseň/zimu',
  'rodinna-imunita': 'Rodinná imunita',
  'imunita-energia': 'Imunita & energia',
  'office-relax': 'Office relax',
  'spanok-krasa': 'Spánok & krása',
  'vytrvalost': 'Vytrvalosť',
  'bezecky-balicek': 'Bežecký balíček',
  'crossfit-power': 'CrossFit power',
  'ranny-energizer': 'Ranný energizer',
  'vecerna-regeneracia': 'Večerná regenerácia',
}

function getWpAuth() {
  const baseUrl = (process.env.WORDPRESS_BASE_URL || '').replace(/\/$/, '')
  const user = process.env.WORDPRESS_ADMIN_USER || process.env.WP_ADMIN_USER
  const pass =
    process.env.WORDPRESS_APP_PASSWORD ||
    process.env.WORDPRESS_APPLICATION_PASSWORD ||
    process.env.WP_APP_PASSWORD
  if (!baseUrl || !user || !pass) {
    throw new Error(
      'Missing WORDPRESS_BASE_URL + WORDPRESS_ADMIN_USER + WORDPRESS_APP_PASSWORD for media upload',
    )
  }
  return { baseUrl, user, pass }
}

function basicAuthHeader(user, pass) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

async function findMediaByFilename(filename) {
  const { baseUrl, user, pass } = getWpAuth()
  const url = new URL('/wp-json/wp/v2/media', baseUrl)
  url.searchParams.set('search', filename)
  url.searchParams.set('per_page', '20')
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: basicAuthHeader(user, pass),
      'User-Agent': 'growmedica-assign-bundle-images',
    },
  })
  if (!res.ok) {
    throw new Error(`Media search failed: ${res.status} ${await res.text()}`)
  }
  const items = await res.json()
  if (!Array.isArray(items)) return null
  const exact = items.find((m) => {
    const src = String(m.source_url || m.guid?.rendered || '')
    return src.endsWith(`/${filename}`) || src.includes(`/${filename}`)
  })
  return exact || null
}

async function uploadMedia(filePath, filename, title, alt) {
  const existing = await findMediaByFilename(filename)
  if (existing?.id) {
    return { id: existing.id, src: existing.source_url, reused: true }
  }

  if (dryRun) {
    return { id: 0, src: `file://${filePath}`, reused: false, dry: true }
  }

  const { baseUrl, user, pass } = getWpAuth()
  const body = readFileSync(filePath)
  const url = new URL('/wp-json/wp/v2/media', baseUrl)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(user, pass),
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'User-Agent': 'growmedica-assign-bundle-images',
    },
    body,
  })
  if (!res.ok) {
    throw new Error(`Media upload failed for ${filename}: ${res.status} ${await res.text()}`)
  }
  const media = await res.json()

  // Set alt text (best-effort)
  try {
    await fetch(new URL(`/wp-json/wp/v2/media/${media.id}`, baseUrl).toString(), {
      method: 'POST',
      headers: {
        Authorization: basicAuthHeader(user, pass),
        'Content-Type': 'application/json',
        'User-Agent': 'growmedica-assign-bundle-images',
      },
      body: JSON.stringify({
        title,
        alt_text: alt,
        caption: alt,
      }),
    })
  } catch {
    /* ignore alt update failures */
  }

  return { id: media.id, src: media.source_url, reused: false }
}

async function findProductBySlug(slug) {
  const results = await wooGet('/products', { slug, per_page: 1 })
  return Array.isArray(results) && results.length > 0 ? results[0] : null
}

async function main() {
  console.log(
    `Assign curated bundle images${dryRun ? ' (dry-run)' : ''}${force ? ' [force]' : ''}…`,
  )
  console.log(`Images dir: ${IMAGES_DIR}`)

  let ok = 0
  let skip = 0
  let fail = 0

  for (const [slug, name] of Object.entries(BUNDLE_SHOTS)) {
    const handle = `balicek-${slug}`
    const filename = `${slug}.jpg`
    const filePath = join(IMAGES_DIR, filename)

    if (!existsSync(filePath)) {
      console.error(`FAIL ${handle}: missing file ${filePath}`)
      fail += 1
      continue
    }

    let product
    try {
      product = await findProductBySlug(handle)
    } catch (err) {
      console.error(`FAIL ${handle}: product lookup — ${err.message}`)
      fail += 1
      continue
    }

    if (!product) {
      console.log(`skip (no Woo product): ${handle}`)
      skip += 1
      continue
    }

    const hasImage = Array.isArray(product.images) && product.images.length > 0
    if (hasImage && !force) {
      console.log(`skip (already has image): ${handle} (id ${product.id}) → ${product.images[0].src}`)
      skip += 1
      continue
    }

    try {
      const media = await uploadMedia(
        filePath,
        filename,
        `Balíček: ${name}`,
        `Balíček GrowMedica — ${name}`,
      )
      console.log(
        `${dryRun ? '[dry-run] ' : ''}${media.reused ? 'REUSE' : 'UPLOAD'} ${filename} → media #${media.id}`,
      )
      console.log(`         ${media.src}`)

      if (!dryRun) {
        await wooPut(`/products/${product.id}`, {
          images: [{ id: media.id, name: `Balíček: ${name}`, alt: `Balíček GrowMedica — ${name}` }],
        })
      }
      console.log(
        `${dryRun ? '[dry-run] ' : ''}SET ${handle} (id ${product.id}) ← media #${media.id}`,
      )
      ok += 1
    } catch (err) {
      console.error(`FAIL ${handle}:`, err.message)
      fail += 1
    }
  }

  console.log(`Done. ok=${ok} skip=${skip} fail=${fail}${dryRun ? ' (dry-run — no writes)' : ''}`)
  if (fail > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
