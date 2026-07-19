#!/usr/bin/env node
/**
 * Create health bundle products in WooCommerce (top N from catalog.ts).
 *
 * Env (never commit):
 *   WORDPRESS_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET
 *
 * Local dev default: reads storefront/.env.local (same as import-woo-products.mjs).
 * Production: from the dashboard repo root run
 *   source ./scripts/load-wp-prod-env.sh
 * then run this script from storefront/ so it picks up the exported env vars
 * (loadEnvLocal never overwrites an already-set process.env value).
 *
 * Usage:
 *   node scripts/create-woo-bundles.mjs --dry-run
 *   node scripts/create-woo-bundles.mjs
 *   node scripts/create-woo-bundles.mjs --limit=5
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, wooGet, wooPost } from './lib/woo-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

loadEnvLocal(ROOT)

const dryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const ITEM_UNIT_EUR = 14.9

/** Bundles with curated product shots — keep in sync with catalog.ts + assign-bundle-images.mjs. */
const BUNDLES = [
  // batch 1
  { slug: 'imunitny-stit-basic', name: 'Imunitný Štít Basic', category: 'Imunita', items: ['Vitamín C 1000 mg', 'Vitamín D3 2000 IU', 'Zinok'], discountPercent: 10 },
  { slug: 'imunitny-stit-plus', name: 'Imunitný Štít Plus', category: 'Imunita', items: ['Vitamín C 1000 mg', 'Vitamín D3 2000 IU', 'Zinok', 'Selén', 'Probiotiká'], discountPercent: 12 },
  { slug: 'pokojny-vecer', name: 'Pokojný večer', category: 'Spánok a stres', items: ['Magnézium', 'L-theanín', 'Melatonín'], discountPercent: 10 },
  { slug: 'anti-stres-den', name: 'Anti-stres deň', category: 'Spánok a stres', items: ['Ashwagandha', 'B-komplex', 'Magnézium'], discountPercent: 12 },
  { slug: 'hlboky-spanok', name: 'Hlboký spánok', category: 'Spánok a stres', items: ['Melatonín', 'Valeriana', 'Magnézium glycinát'], discountPercent: 12 },
  { slug: 'starter-fitness', name: 'Štartér fitness', category: 'Športová výživa', items: ['Whey proteín', 'BCAA', 'Multivitamín'], discountPercent: 12 },
  { slug: 'silovy-trenink', name: 'Silový tréning', category: 'Športová výživa', items: ['Kreatín', 'Whey proteín', 'Beta-alanín'], discountPercent: 12 },
  { slug: 'regeneracia-po-treninku', name: 'Regenerácia po tréningu', category: 'Regenerácia', items: ['Proteín', 'Magnézium', 'Omega-3'], discountPercent: 12 },
  { slug: 'klby-basic', name: 'Kĺby Basic', category: 'Kĺby a pohyb', items: ['Glukosamín', 'Chondroitín', 'MSM'], discountPercent: 10 },
  { slug: 'srdce-basic', name: 'Srdce Basic', category: 'Srdce a cievy', items: ['Omega-3', 'CoQ10'], discountPercent: 10 },
  { slug: 'crevna-rovnovaha', name: 'Črevná rovnováha', category: 'Trávenie', items: ['Probiotiká 10 mld', 'Inulín'], discountPercent: 10 },
  { slug: 'krasa-zvnutra', name: 'Krása zvnútra', category: 'Krása a pokožka', items: ['Kolagén', 'Biotín', 'Vitamín C'], discountPercent: 12 },
  { slug: 'denny-zaklad', name: 'Denný základ', category: 'Vitamíny a minerály', items: ['Multivitamín', 'Omega-3', 'Vitamín D3'], discountPercent: 12 },
  { slug: 'focus-mozog', name: 'Focus & mozog', category: 'Špeciálna výživa', items: ["Lion's Mane", 'Omega-3', 'B-komplex'], discountPercent: 15 },
  { slug: 'growmedica-komplet', name: 'GrowMedica Komplet', category: 'Vitamíny a minerály', items: ['Multivitamín', 'Omega-3', 'Vitamín D3', 'Probiotiká', 'Magnézium'], discountPercent: 20 },
  // batch 2
  { slug: 'imunita-jesen-zima', name: 'Imunita na jeseň/zimu', category: 'Imunita', items: ['Vitamín C', 'Vitamín D3', 'Echinacea', 'Beta-glukán'], discountPercent: 12 },
  { slug: 'rodinna-imunita', name: 'Rodinná imunita', category: 'Imunita', items: ['Detský multivitamín', 'Multivitamín pre dospelých', 'Vitamín D3'], discountPercent: 15 },
  { slug: 'imunita-energia', name: 'Imunita & energia', category: 'Imunita', items: ['Vitamín C', 'Cordyceps', 'CoQ10'], discountPercent: 12 },
  { slug: 'office-relax', name: 'Office relax', category: 'Spánok a stres', items: ['Ashwagandha', 'Omega-3', 'Vitamín B12'], discountPercent: 12 },
  { slug: 'spanok-krasa', name: 'Spánok & krása', category: 'Spánok a stres', items: ['Magnézium', 'Kolagén', 'Hyaluron'], discountPercent: 15 },
  { slug: 'vytrvalost', name: 'Vytrvalosť', category: 'Športová výživa', items: ['Izotonický nápoj', 'BCAA', 'Elektrolyty'], discountPercent: 10 },
  { slug: 'bezecky-balicek', name: 'Bežecký balíček', category: 'Športová výživa', items: ['Elektrolyty', 'Kolagén typ II', 'Vitamín C'], discountPercent: 12 },
  { slug: 'crossfit-power', name: 'CrossFit power', category: 'Športová výživa', items: ['Kreatín', 'BCAA', 'Zinok'], discountPercent: 12 },
  { slug: 'ranny-energizer', name: 'Ranný energizer', category: 'Regenerácia', items: ['Cordyceps', 'Kofeín', 'B-komplex'], discountPercent: 10 },
  { slug: 'vecerna-regeneracia', name: 'Večerná regenerácia', category: 'Regenerácia', items: ['Proteín', 'ZMA', 'Omega-3'], discountPercent: 15 },
  // batch 3
  { slug: 'klby-active', name: 'Kĺby Active', category: 'Kĺby a pohyb', items: ['Glukosamín', 'Chondroitín', 'MSM', 'Kolagén typ II', 'Vitamín C'], discountPercent: 15 },
  { slug: 'srdce-plus', name: 'Srdce Plus', category: 'Srdce a cievy', items: ['Omega-3', 'CoQ10', 'Magnézium', 'Vitamín E'], discountPercent: 12 },
  { slug: 'cholesterol-balance', name: 'Cholesterol balance', category: 'Srdce a cievy', items: ['Omega-3', 'Rýžový olej', 'Vitamín E'], discountPercent: 12 },
  { slug: 'pecen-basic', name: 'Pečeň Basic', category: 'Detox a pečeň', items: ['Ostropestrec', 'Artičok'], discountPercent: 10 },
  { slug: 'detox-criev-jemne', name: 'Detox čriev jemne', category: 'Trávenie', items: ['Probiotiká', 'Psyllium', 'Aktivované uhlie'], discountPercent: 12 },
  { slug: 'turistika-pohyb', name: 'Turistika & pohyb', category: 'Kĺby a pohyb', items: ['Kolagén', 'Magnézium', 'Omega-3'], discountPercent: 12 },
  { slug: 'po-antibiotikach', name: 'Po antibiotikách', category: 'Trávenie', items: ['Probiotiká vysoká dávka', 'Prebiotiká'], discountPercent: 15 },
  { slug: 'krvny-obeh', name: 'Krvný obeh', category: 'Srdce a cievy', items: ['Ginkgo biloba', 'Omega-3', 'Vitamín B6'], discountPercent: 12 },
  { slug: 'travenie-komfort', name: 'Trávenie komfort', category: 'Trávenie', items: ['Tráviace enzýmy', 'Probiotiká', 'Fenikel'], discountPercent: 12 },
  { slug: 'senior-pohyb', name: 'Senior pohyb', category: 'Kĺby a pohyb', items: ['Glukosamín', 'Vitamín D3', 'Omega-3'], discountPercent: 12 },
].slice(0, limitArg ? Number(limitArg.split('=')[1]) : 35)

function estimatePricing(bundle) {
  const regular = Math.round(bundle.items.length * ITEM_UNIT_EUR * 100) / 100
  const sale = Math.round(regular * (1 - bundle.discountPercent / 100) * 100) / 100
  return { regular: regular.toFixed(2), sale: sale.toFixed(2) }
}

function buildDescription(bundle) {
  const list = bundle.items.map((item) => `<li>${item}</li>`).join('')
  return (
    `<p>Balíček GrowMedica — overená kombinácia doplnkov na jeden cieľ. Obsahuje:</p>` +
    `<ul>${list}</ul>` +
    `<p><em>Ceny komponentov sú orientačné; upravte podľa skutočných SKU v administrácii.</em></p>`
  )
}

async function findExistingBySlug(slug) {
  const results = await wooGet('/products', { slug, per_page: 1 })
  return Array.isArray(results) && results.length > 0 ? results[0] : null
}

async function createBundleProduct(bundle) {
  const handle = `balicek-${bundle.slug}`
  const { regular, sale } = estimatePricing(bundle)

  if (dryRun) {
    console.log(`[dry-run] ${handle} — ${sale} EUR (was ${regular} EUR, −${bundle.discountPercent}%)`)
    return
  }

  const existing = await findExistingBySlug(handle)
  if (existing) {
    console.log(`skip (exists): ${handle} (id ${existing.id})`)
    return
  }

  const payload = {
    name: `Balíček: ${bundle.name}`,
    slug: handle,
    sku: handle,
    type: 'simple',
    status: 'publish',
    catalog_visibility: 'visible',
    manage_stock: false,
    regular_price: regular,
    sale_price: sale,
    description: buildDescription(bundle),
    short_description: `${bundle.items.join(' + ')} — zvýhodnená kombinácia so zľavou ${bundle.discountPercent} %.`,
    tags: [{ name: 'Balíček zdravia' }, { name: bundle.category }],
  }

  const created = await wooPost('/products', payload)
  console.log(`created: ${handle} (id ${created.id}) — ${sale} EUR (regular ${regular} EUR)`)
}

async function main() {
  console.log(`Creating up to ${BUNDLES.length} bundle products${dryRun ? ' (dry-run)' : ''}…`)
  for (const bundle of BUNDLES) {
    try {
      await createBundleProduct(bundle)
    } catch (error) {
      console.error(`FAILED ${bundle.slug}:`, error.message)
    }
  }
  console.log('Done. Then verify: node scripts/verify-woo-bundle-search.mjs')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
