#!/usr/bin/env node
/**
 * Agent-friendly Shopify Admin token onboarding.
 *
 * Automates: .env.local upsert, Admin API verify, Vercel env, storefront smoke.
 * Cannot automate: Shopify Admin UI (Install app), Nexus/Lovable env.
 *
 * Usage:
 *   yarn shopify:admin-onboard --token shpat_...
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_... yarn shopify:admin-onboard
 *   yarn shopify:admin-onboard --json
 *   yarn shopify:admin-onboard --verify-only
 */

import { execSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_SHOPIFY_STORE,
  loadEnvLocal,
  adminGraphql,
} from './lib/shopify-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const ENV_FILE = resolve(ROOT, '.env.local')
const RUNBOOK = resolve(ROOT, 'docs/poznamky-agent.json')

const URLS = {
  develop_apps: 'https://admin.shopify.com/store/growmedica/settings/apps/development',
  nexus_admin: 'https://growmedica-nexus.lovable.app/admin',
}

const DEFAULT_ENV_KEYS = {
  CMS_PROVIDER: 'shopify',
  SHOPIFY_STORE_DOMAIN: CANONICAL_SHOPIFY_STORE,
  SHOPIFY_STOREFRONT_TOKENLESS: '1',
  SHOPIFY_API_VERSION: '2025-01',
  SHOPIFY_REVALIDATION_SECRET: 'local-shopify-revalidation-secret-16',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:5555',
  NEXT_PUBLIC_DASHBOARD_URL: 'https://growmedica-nexus.lovable.app/admin',
  NEXT_PUBLIC_DASHBOARD_MODE: 'hybrid',
  DASHBOARD_AGENT_SECRET: 'local-dashboard-agent-secret-min-16-chars',
  MISTRAL_MOCK_MODE: '0',
  MISTRAL_MODEL: 'mistral-large-latest',
}

function parseArgs(argv) {
  const out = {
    token: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || '',
    json: false,
    verifyOnly: false,
    vercel: true,
    skipSmoke: false,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') out.json = true
    else if (a === '--verify-only') out.verifyOnly = true
    else if (a === '--no-vercel') out.vercel = false
    else if (a === '--skip-smoke') out.skipSmoke = true
    else if (a === '--token' && argv[i + 1]) {
      out.token = argv[++i].trim()
    }
  }
  return out
}

function log(msg) {
  if (!parseArgs(process.argv).json) console.log(msg)
}

function upsertEnvLocal(updates) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split('\n') : []
  const map = new Map()
  const order = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!map.has(key)) order.push(key)
    map.set(key, trimmed.slice(eq + 1).trim())
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue
    if (!map.has(key)) order.push(key)
    map.set(key, value)
  }

  const preserved = new Set(order)
  const header = [
    '# CMS — live Shopify (growmedica.myshopify.com)',
    '# Agent: yarn shopify:admin-onboard — docs/poznamky-agent.json',
    '',
  ]
  const body = order.map((k) => `${k}=${map.get(k)}`)
  const tail = lines.filter((l) => {
    const t = l.trim()
    if (!t || t.startsWith('#')) return false
    const eq = t.indexOf('=')
    if (eq === -1) return false
    return !preserved.has(t.slice(0, eq).trim())
  })

  writeFileSync(ENV_FILE, [...header, ...body, ...tail].join('\n') + '\n', 'utf8')
  chmodSync(ENV_FILE, 0o600)
}

async function verifyAdminToken(token) {
  if (!token?.startsWith('shpat_')) {
    return { ok: false, code: 'missing_token', message: 'Missing or invalid SHOPIFY_ADMIN_ACCESS_TOKEN (must start with shpat_)' }
  }

  try {
    const data = await adminGraphql('{ shop { name myshopifyDomain } }', {}, {
      store: CANONICAL_SHOPIFY_STORE,
      token,
      apiVersion: process.env.SHOPIFY_API_VERSION ?? '2025-01',
    })
    return {
      ok: true,
      code: 'ok',
      shop: data.shop?.name,
      domain: data.shop?.myshopifyDomain,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('403')) {
      return {
        ok: false,
        code: '403_api_disabled',
        message: 'Shopify Admin API disabled — Install app in Develop apps',
        human_url: URLS.develop_apps,
      }
    }
    if (msg.includes('401')) {
      return { ok: false, code: '401_unauthorized', message: 'Invalid or revoked Admin token', human_url: URLS.develop_apps }
    }
    return { ok: false, code: 'error', message: msg }
  }
}

function pushVercelAdminToken(token) {
  const targets = ['production', 'preview', 'development']
  const scope = process.env.VERCEL_SCOPE ?? 'h4ck3d'
  for (const target of targets) {
    spawnSync(
      'vercel',
      ['env', 'rm', 'SHOPIFY_ADMIN_ACCESS_TOKEN', target, '--yes', '--scope', scope, '--non-interactive'],
      { cwd: ROOT, stdio: 'ignore' },
    )
    const add = spawnSync(
      'vercel',
      ['env', 'add', 'SHOPIFY_ADMIN_ACCESS_TOKEN', target, '--yes', '--scope', scope, '--non-interactive'],
      { cwd: ROOT, input: token, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    if (add.status !== 0) {
      return { ok: false, target, stderr: add.stderr?.toString() ?? '' }
    }
  }
  return { ok: true, targets }
}

function runStorefrontSmoke() {
  try {
    execSync('node scripts/shopify-smoke-test.mjs', { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' })
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e.stderr?.toString() || e.message }
  }
}

function finish(report) {
  if (parseArgs(process.argv).json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    log('')
    log(`=== ${report.status.toUpperCase()} ===`)
    for (const s of report.automated) log(`✓ ${s}`)
    for (const p of report.pending_human) {
      log(`⏳ ${p.id}: ${p.message}`)
      if (p.url) log(`   → ${p.url}`)
    }
    if (report.errors?.length) {
      for (const e of report.errors) log(`✗ ${e}`)
    }
    log('')
    log('Runbook: docs/poznamky-agent.json')
  }
  process.exit(report.status === 'ok' ? 0 : report.status === 'partial' ? 0 : 1)
}

async function main() {
  const args = parseArgs(process.argv)
  loadEnvLocal(ROOT)

  if (!args.token) {
    const fromFile = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim()
    if (fromFile?.startsWith('shpat_')) args.token = fromFile
  }

  const report = {
    status: 'blocked',
    admin_api: 'skipped',
    env_local: 'skipped',
    vercel: 'skipped',
    storefront_smoke: 'skipped',
    automated: [],
    pending_human: [],
    errors: [],
    runbook: 'docs/poznamky-agent.json',
    human_doc: 'docs/poznamky.md',
  }

  if (!args.token) {
    report.errors.push('missing_token')
    report.pending_human.push({
      id: 'shopify_create_token',
      message: 'Získaj shpat_ v Shopify Develop apps a spusti znova s --token',
      url: URLS.develop_apps,
    })
    return finish(report)
  }

  if (!args.verifyOnly) {
    const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : ''
    const mistralKey = existing.match(/^MISTRAL_API_KEY=(.+)$/m)?.[1]?.trim()
    upsertEnvLocal({
      ...DEFAULT_ENV_KEYS,
      SHOPIFY_ADMIN_ACCESS_TOKEN: args.token,
      ...(mistralKey ? { MISTRAL_API_KEY: mistralKey } : {}),
    })
    loadEnvLocal(ROOT)
    report.env_local = 'ok'
    report.automated.push('Updated .env.local (chmod 600)')
  }

  const verify = await verifyAdminToken(args.token)
  report.admin_api = verify.ok ? 'ok' : verify.code
  if (verify.ok) {
    report.automated.push(`Admin API OK: ${verify.shop} (${verify.domain})`)
  } else {
    report.errors.push(verify.message)
    report.pending_human.push({
      id: 'shopify_create_token',
      message: verify.message,
      url: verify.human_url ?? URLS.develop_apps,
    })
    report.status = 'blocked'
    if (!args.verifyOnly && args.vercel) report.vercel = 'skipped_admin_invalid'
    return finish(report)
  }

  if (args.verifyOnly) {
    report.status = 'ok'
    return finish(report)
  }

  if (args.vercel) {
    if (spawnSync('which', ['vercel'], { stdio: 'ignore' }).status !== 0) {
      report.vercel = 'skipped_no_cli'
      report.errors.push('Vercel CLI not found — skip or npm i -g vercel')
    } else {
      const v = pushVercelAdminToken(args.token)
      if (v.ok) {
        report.vercel = 'ok'
        report.automated.push(`Vercel SHOPIFY_ADMIN_ACCESS_TOKEN → ${v.targets.join(', ')}`)
      } else {
        report.vercel = 'error'
        report.errors.push(`Vercel push failed: ${v.stderr || v.target}`)
      }
    }
  }

  if (!args.skipSmoke) {
    const smoke = runStorefrontSmoke()
    report.storefront_smoke = smoke.ok ? 'ok' : 'error'
    if (smoke.ok) report.automated.push('storefront smoke passed')
    else report.errors.push(`smoke: ${smoke.message}`)
  }

  report.pending_human.push({
    id: 'nexus_env',
    message: 'Vlož rovnaký SHOPIFY_ADMIN_ACCESS_TOKEN do Nexus (Lovable) — mimo tohto repa',
    url: URLS.nexus_admin,
    env: {
      SHOPIFY_STORE_DOMAIN: CANONICAL_SHOPIFY_STORE,
      SHOPIFY_ADMIN_ACCESS_TOKEN: '<same shpat_>',
      SHOPIFY_API_VERSION: '2025-01',
    },
  })

  const hardFail = report.errors.some((e) => e.startsWith('smoke:') || report.vercel === 'error')
  report.status = hardFail ? 'partial' : 'ok'
  return finish(report)
}

main().catch((err) => {
  const report = { status: 'error', message: err instanceof Error ? err.message : String(err) }
  if (parseArgs(process.argv).json) console.log(JSON.stringify(report, null, 2))
  else console.error(err)
  process.exit(1)
})