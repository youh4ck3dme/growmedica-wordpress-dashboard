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
  verifyAdminTokenRest,
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
  SHOPIFY_STORE_DOMAIN: CANONICAL_SHOPIFY_STORE,
  SHOPIFY_STOREFRONT_TOKENLESS: '1',
  SHOPIFY_API_VERSION: '2025-01',
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
    else if ((a === '--token' || a === '-t') && argv[i + 1]) {
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
  const preamble = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      if (order.length === 0) preamble.push(line)
      continue
    }
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

  const header =
    preamble.length > 0
      ? preamble
      : [
          '# CMS — Shopify Admin onboard (merge, neprepisuje existujúce kľúče)',
          '# Agent: yarn shopify:admin-onboard — docs/poznamky-agent.json',
          '',
        ]

  const body = order.map((k) => `${k}=${map.get(k)}`)
  writeFileSync(ENV_FILE, [...header, ...body].join('\n') + '\n', 'utf8')
  chmodSync(ENV_FILE, 0o600)
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
      { cwd: ROOT, input: Buffer.from(token, 'utf8'), stdio: ['pipe', 'pipe', 'pipe'] },
    )
    if (add.status !== 0) {
      const addPipe = spawnSync('bash', ['-c', `printf '%s' "$TOKEN" | vercel env add SHOPIFY_ADMIN_ACCESS_TOKEN ${target} --yes --scope ${scope} --non-interactive`], {
        cwd: ROOT,
        env: { ...process.env, TOKEN: token },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      if (addPipe.status !== 0) {
        return { ok: false, target, stderr: addPipe.stderr?.toString() ?? add.stderr?.toString() ?? '' }
      }
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
      if (p.install_steps?.length) {
        for (const step of p.install_steps) log(`   • ${step}`)
      }
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

  const verify = await verifyAdminTokenRest(args.token)
  report.admin_api = verify.ok ? 'ok' : verify.code
  if (verify.ok) {
    report.automated.push(`Admin API OK: ${verify.shop} (${verify.domain})`)
  } else {
    report.errors.push(verify.message)
    report.pending_human.push({
      id: 'shopify_create_token',
      message: verify.message,
      url: verify.human_url ?? URLS.develop_apps,
      ...(verify.install_steps ? { install_steps: verify.install_steps } : {}),
    })
    if (!args.verifyOnly && args.vercel) {
      if (spawnSync('which', ['vercel'], { stdio: 'ignore' }).status === 0) {
        const v = pushVercelAdminToken(args.token)
        if (v.ok) {
          report.vercel = verify.code === '403_api_disabled' ? 'ok_pending_shopify_install' : 'ok'
          report.automated.push(
            `Vercel SHOPIFY_ADMIN_ACCESS_TOKEN → ${v.targets.join(', ')}`,
          )
          if (verify.code === '403_api_disabled') {
            report.status = 'partial'
            report.automated.push('Token uložený lokálne + Vercel — čaká sa na Install app v Shopify Admin')
          }
        } else {
          report.vercel = 'error'
          report.errors.push(`Vercel push failed: ${v.stderr || v.target}`)
        }
      } else {
        report.vercel = 'skipped_no_cli'
      }
    }
    if (report.status !== 'partial') report.status = 'blocked'
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