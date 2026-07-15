#!/usr/bin/env node
/**
 * Fix Shopify Admin 403 "API Access has been disabled".
 * Opens Shopify Admin in browser, then polls until token works → runs onboard.
 *
 * Usage:
 *   yarn shopify:admin-fix
 *   yarn shopify:admin-fix --token shpat_...
 *   yarn shopify:admin-fix --wait 120
 */

import { spawnSync, execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, verifyAdminTokenRest } from './lib/shopify-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const URLS = [
  'https://admin.shopify.com/store/growmedica/settings/apps/development',
  'https://admin.shopify.com/store/growmedica/settings/apps',
]

function parseArgs() {
  let token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() ?? ''
  let waitSec = 180
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--token' && process.argv[i + 1]) token = process.argv[++i].trim()
    else if (process.argv[i] === '--wait' && process.argv[i + 1]) waitSec = Number(process.argv[++i])
  }
  return { token, waitSec }
}

async function verifyToken(token) {
  const v = await verifyAdminTokenRest(token)
  if (v.ok) return { ok: true, shop: v.shop }
  return { ok: false, code: v.code === '403_api_disabled' ? '403' : v.code === '401_unauthorized' ? '401' : v.code, msg: v.message }
}

function openBrowser() {
  for (const url of URLS) {
    spawnSync('open', [url], { stdio: 'ignore' })
  }
}

async function main() {
  loadEnvLocal(ROOT)
  const { token, waitSec } = parseArgs()

  console.log('')
  console.log('=== Shopify Admin 403 — oprava ===')
  console.log('')
  console.log('V prehliadači (práve otvorenom):')
  console.log('  1. Create an app alebo otvor existujúcu')
  console.log('  2. Configure Admin API scopes → read_products, write_products, read_inventory')
  console.log('  3. Save')
  console.log('  4. API credentials → Install app  ← POVINNÉ')
  console.log('  5. Skopíruj nový Admin API access token (shpat_...)')
  console.log('')

  openBrowser()

  let activeToken = token
  const deadline = Date.now() + waitSec * 1000
  let attempt = 0

  while (Date.now() < deadline) {
    attempt++
    const v = await verifyToken(activeToken)
    if (v.ok) {
      console.log(`✓ Admin API funguje: ${v.shop}`)
      execSync(`node scripts/shopify-admin-onboard.mjs --token "${activeToken}"`, {
        cwd: ROOT,
        stdio: 'inherit',
      })
      return
    }

    if (attempt === 1 || attempt % 6 === 0) {
      console.log(`… čakám na Install app (${v.code}) — pokus ${attempt}, zostáva ~${Math.ceil((deadline - Date.now()) / 1000)} s`)
      console.log('  Po Install skopíruj token a spusti:')
      console.log('  yarn shopify:admin-fix --token "shpat_NOVY"')
    }

    await new Promise((r) => setTimeout(r, 5000))
  }

  console.log('')
  console.log('✗ Token stále nefunguje.')
  console.log('  Over v Shopify: API credentials → Install app (nie len Create app).')
  console.log('  Potom: yarn shopify:admin-onboard --token "shpat_NOVY" --json')
  console.log('')
  console.log('Alternatíva (Dev Dashboard 2026): SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET')
  console.log('  → docs/poznamky.md sekcia Dev Dashboard')
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})