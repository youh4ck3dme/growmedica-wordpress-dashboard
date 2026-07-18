#!/usr/bin/env node
/**
 * Production smoke: WooCommerce-backed storefront HTTP checks.
 *
 * Usage:
 *   PREVIEW_URL=https://www.growmedica.cz node scripts/production-smoke.mjs
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

  const previewUrl = (
    process.env.PREVIEW_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5555'
  ).replace(/\/$/, '')
  const wooMock = process.env.WOO_MOCK_MODE === '1'

  console.log('=== GrowMedica production smoke ===')
  console.log(`Preview URL: ${previewUrl}`)
  console.log('CMS: wordpress / woocommerce')

  const isRemotePreview = /^https?:\/\/(www\.)?growmedica\.cz/i.test(previewUrl)

  if (isRemotePreview) {
    console.log('→ Remote production smoke (skip local Woo curl)')
  } else if (!wooMock) {
    const bash = spawnSync('bash', ['scripts/woo-smoke-test.sh'], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    })
    if (bash.status !== 0) {
      process.exit(bash.status ?? 1)
    }
  } else {
    console.log('→ Skipping WooCommerce curl (WOO_MOCK_MODE=1)')
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

  if (isRemotePreview) {
    const productsUrl = `${previewUrl}/api/products?limit=1`
    console.log(`→ catalog probe ${productsUrl}`)
    const res = await fetch(productsUrl, { redirect: 'follow' })
    const json = await res.json()
    const id = json?.products?.[0]?.id ?? ''
    if (!String(id).includes('woocommerce')) {
      console.error('❌ Expected gid://woocommerce/… product id, got:', id)
      process.exit(1)
    }
    console.log('✅ catalog product id:', String(id).slice(0, 48))
  }

  const revalidateSecret = process.env.WORDPRESS_REVALIDATION_SECRET
  const revalidateTag = 'woo-products'

  if (!revalidateSecret?.trim()) {
    console.warn(
      '⚠️ Skipping ISR revalidate — set WORDPRESS_REVALIDATION_SECRET (production value from Vercel)',
    )
  } else {
    const revalidateUrl = `${previewUrl}/api/revalidate`
    console.log(`→ POST ${revalidateUrl} (header x-revalidation-secret, tag=${revalidateTag})`)
    let rev = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': revalidateSecret,
      },
      body: JSON.stringify({ tag: revalidateTag }),
    })
    if (!rev.ok) {
      console.log(
        `→ POST ${revalidateUrl}?secret=<secret>&tag=${revalidateTag} (query fallback)`,
      )
      rev = await fetch(
        `${revalidateUrl}?secret=${encodeURIComponent(revalidateSecret)}&tag=${encodeURIComponent(revalidateTag)}`,
        { method: 'POST' },
      )
    }
    if (!rev.ok) {
      console.warn(`⚠️ Revalidate HTTP ${rev.status} (local secret may ≠ Vercel). Public endpoints OK.`)
    } else {
      console.log('✅ revalidate OK')
    }
  }

  console.log('')
  console.log('✅ Production smoke passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
