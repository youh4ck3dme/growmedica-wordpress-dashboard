#!/usr/bin/env node
/**
 * Production smoke: WooCommerce API curl + storefront HTTP checks.
 *
 * Usage:
 *   PREVIEW_URL=https://growmedica.cz node scripts/production-smoke.mjs
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

async function main() {
  loadEnvLocal()

  const previewUrl = (process.env.PREVIEW_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5555').replace(/\/$/, '')
  const cmsProvider = process.env.CMS_PROVIDER ?? 'shopify'
  const wooMock = process.env.WOO_MOCK_MODE === '1'
  const shopifyMock = process.env.SHOPIFY_MOCK_MODE === '1'

  console.log('=== GrowMedica production smoke ===')
  console.log(`Preview URL: ${previewUrl}`)
  console.log(`CMS_PROVIDER: ${cmsProvider}`)

  const isRemotePreview = /^https?:\/\/(www\.)?growmedica\.cz/i.test(previewUrl)

  // Live production: only hit public www endpoints (no local :8080 Woo curl).
  if (isRemotePreview) {
    console.log('→ Remote production smoke (skip local Woo/Shopify curl)')
  } else if (cmsProvider === 'shopify' && !shopifyMock) {
    const shopify = spawnSync('node', ['scripts/shopify-smoke-test.mjs'], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    })
    if (shopify.status !== 0) {
      process.exit(shopify.status ?? 1)
    }
  } else if (!wooMock && cmsProvider === 'wordpress') {
    const bash = spawnSync('bash', ['scripts/woo-smoke-test.sh'], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    })
    if (bash.status !== 0) {
      process.exit(bash.status ?? 1)
    }
  } else if (shopifyMock && cmsProvider === 'shopify') {
    console.log('→ Skipping Shopify Storefront smoke (SHOPIFY_MOCK_MODE=1)')
  } else {
    console.log('→ Skipping WooCommerce curl (WOO_MOCK_MODE or non-WP provider)')
  }

  const endpoints = ['/api/products', '/kolekcie', '/produkty', '/kontakt']
  for (const endpoint of endpoints) {
    const url = `${previewUrl}${endpoint}`
    console.log(`→ GET ${url}`)
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      console.error(`❌ ${endpoint} returned HTTP ${res.status}`)
      process.exit(1)
    }
    console.log(`✅ ${endpoint} HTTP ${res.status}`)
  }

  // Catalog SoT check on production
  if (isRemotePreview) {
    const productsUrl = `${previewUrl}/api/products?limit=1`
    console.log(`→ catalog probe ${productsUrl}`)
    const res = await fetch(productsUrl, { redirect: 'follow' })
    const json = await res.json()
    const id = json?.products?.[0]?.id ?? ''
    if (!String(id).includes('woocommerce') && !String(id).includes('shopify')) {
      console.error('❌ Unexpected product id shape:', id)
      process.exit(1)
    }
    console.log('✅ catalog product id:', String(id).slice(0, 48))
  }

  const revalidateSecret =
    cmsProvider === 'shopify'
      ? process.env.SHOPIFY_REVALIDATION_SECRET
      : process.env.WORDPRESS_REVALIDATION_SECRET ?? process.env.SHOPIFY_REVALIDATION_SECRET

  const revalidateTag = cmsProvider === 'shopify' ? 'products' : 'woo-products'

  if (!revalidateSecret?.trim()) {
    console.warn(
      `⚠️ Skipping ISR revalidate — set ${cmsProvider === 'shopify' ? 'SHOPIFY_REVALIDATION_SECRET' : 'WORDPRESS_REVALIDATION_SECRET'} (production value from Vercel)`,
    )
  } else {
    const revalidateUrl = `${previewUrl}/api/revalidate?secret=${encodeURIComponent(revalidateSecret)}&tag=${revalidateTag}`
    console.log(`→ POST ${revalidateUrl.replace(revalidateSecret, '<secret>')}`)
    const rev = await fetch(revalidateUrl, { method: 'POST' })
    if (!rev.ok) {
      // Local env secret often differs from Vercel production secret — warn only on remote.
      if (isRemotePreview && rev.status === 401) {
        console.warn(
          `⚠️ Revalidate HTTP 401 (local WORDPRESS_REVALIDATION_SECRET ≠ Vercel). Public endpoints OK.`,
        )
      } else {
        console.error(`❌ Revalidate returned HTTP ${rev.status}`)
        process.exit(1)
      }
    } else {
      console.log('✅ ISR revalidate endpoint reachable')
    }
  }

  console.log('\n✅ Production smoke passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})