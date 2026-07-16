#!/usr/bin/env node
/**
 * Agent-friendly Shopify Admin credentials onboarding.
 *
 * Automates: .env.local upsert, Admin API verify, Vercel env, storefront smoke.
 * Cannot automate: Shopify Admin UI (Install app), Nexus/Lovable env.
 *
 * Usage:
 *   SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... yarn shopify:admin-onboard
 *   yarn shopify:admin-onboard --token shpat_...
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_... yarn shopify:admin-onboard
 *   yarn shopify:admin-onboard --json
 *   yarn shopify:admin-onboard --verify-only
 */

import { execSync, spawn, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_SHOPIFY_STORE,
  DEFAULT_SHOPIFY_API_VERSION,
  fetchClientCredentialsToken,
  loadEnvLocal,
  verifyAdminScopesGraphql,
  verifyAdminTokenRest,
} from './lib/shopify-admin-client.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const ENV_FILE = resolve(ROOT, '.env.local')
const RUNBOOK = resolve(ROOT, 'docs/poznamky-agent.json')

const URLS = {
  develop_apps: 'https://admin.shopify.com/store/growmedica/settings/apps/development',
  dev_dashboard_settings:
    'https://dev.shopify.com/dashboard/220990502/apps/378076692481/settings',
  nexus_admin: 'https://growmedica-nexus.lovable.app/admin',
  shopify_versioning: 'https://shopify.dev/docs/api/usage/versioning',
}

const DEFAULT_ENV_KEYS = {
  CMS_PROVIDER: 'shopify',
  SHOPIFY_STORE_DOMAIN: CANONICAL_SHOPIFY_STORE,
  SHOPIFY_STOREFRONT_TOKENLESS: '1',
  SHOPIFY_API_VERSION: DEFAULT_SHOPIFY_API_VERSION,
}

function parseArgs(argv) {
  const out = {
    token: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || '',
    clientId: process.env.SHOPIFY_CLIENT_ID?.trim() || '',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET?.trim() || '',
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
    } else if (a === '--client-id' && argv[i + 1]) {
      out.clientId = argv[++i].trim()
    }
  }
  return out
}

function log(msg) {
  if (!parseArgs(process.argv).json) console.log(msg)
}

function upsertEnvLocal(updates, removeKeys = []) {
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

  for (const key of removeKeys) map.delete(key)

  const header =
    preamble.length > 0
      ? preamble
      : [
          '# CMS — Shopify Admin onboard (merge, neprepisuje existujúce kľúče)',
          '# Agent: yarn shopify:admin-onboard — docs/poznamky-agent.json',
          '',
        ]

  const body = order.filter((k) => map.has(k)).map((k) => `${k}=${map.get(k)}`)
  writeFileSync(ENV_FILE, [...header, ...body].join('\n') + '\n', 'utf8')
  chmodSync(ENV_FILE, 0o600)
}

function runVercel(args, input) {
  return new Promise((resolveResult) => {
    const child = spawn('vercel', args, {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout = (stdout + chunk.toString()).slice(-20_000)
    })
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-20_000)
    })
    child.on('error', (error) => {
      resolveResult({ status: null, stdout, stderr: `${stderr}\n${error.message}` })
    })
    child.on('close', (status) => {
      resolveResult({ status, stdout, stderr })
    })
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

async function replaceVercelEnv(key, value, { sensitive = false } = {}) {
  const targets = ['production', 'preview', 'development']
  const scope = process.env.VERCEL_SCOPE ?? 'h4ck3d'
  const results = await Promise.all(
    targets.map(async (target) => {
      const flags = [
        'env',
        'add',
        key,
        target,
        '--force',
        '--yes',
        '--scope',
        scope,
        '--non-interactive',
      ]
      if (sensitive && target !== 'development') flags.push('--sensitive')
      const add = await runVercel(flags, value)
      return { ...add, target }
    }),
  )
  const failed = results.find((result) => result.status !== 0)
  if (failed) {
    return {
      ok: false,
      key,
      target: failed.target,
      updated: results.filter((result) => result.status === 0).map((result) => result.target),
    }
  }
  return { ok: true, targets }
}

async function removeVercelEnv(key, targets) {
  const scope = process.env.VERCEL_SCOPE ?? 'h4ck3d'
  const results = await Promise.all(
    targets.map(async (target) => {
      const result = await runVercel(
        ['env', 'rm', key, target, '--yes', '--scope', scope, '--non-interactive'],
        undefined,
      )
      return { ...result, target }
    }),
  )
  const removed = []
  const absent = []
  for (const result of results) {
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    if (result.status === 0) {
      removed.push(result.target)
      continue
    }
    if (output.includes('"reason": "env_not_found"') || output.includes('was not found')) {
      absent.push(result.target)
      continue
    }
    return { ok: false, key, target: result.target, removed, absent }
  }
  return { ok: true, removed, absent }
}

async function pushVercelCredentials({ mode, token, clientId, clientSecret, baseEnv }) {
  const baseKeys = []
  for (const [key, value] of Object.entries(baseEnv)) {
    const result = await replaceVercelEnv(key, value)
    if (!result.ok) return result
    baseKeys.push(key)
  }

  if (mode === 'client_credentials') {
    const idResult = await replaceVercelEnv('SHOPIFY_CLIENT_ID', clientId)
    if (!idResult.ok) return idResult
    const secretResult = await replaceVercelEnv('SHOPIFY_CLIENT_SECRET', clientSecret, {
      sensitive: true,
    })
    if (!secretResult.ok) return secretResult
    const legacyCleanup = await removeVercelEnv(
      'SHOPIFY_ADMIN_ACCESS_TOKEN',
      secretResult.targets,
    )
    if (!legacyCleanup.ok) return legacyCleanup
    return {
      ok: true,
      targets: secretResult.targets,
      keys: [...baseKeys, 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET'],
      legacyCleanup,
    }
  }

  const tokenResult = await replaceVercelEnv('SHOPIFY_ADMIN_ACCESS_TOKEN', token, {
    sensitive: true,
  })
  return tokenResult.ok
    ? { ...tokenResult, keys: [...baseKeys, 'SHOPIFY_ADMIN_ACCESS_TOKEN'] }
    : tokenResult
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
  process.exitCode = report.status === 'ok' ? 0 : 1
  return report
}

export function determineOnboardingStatus(
  report,
  { vercelRequired = true, smokeRequired = true } = {},
) {
  if (report.env_local !== 'ok') return 'blocked'
  if (vercelRequired && report.vercel !== 'ok') return 'blocked'
  if (smokeRequired && report.storefront_smoke !== 'ok') return 'blocked'
  if (report.errors.length > 0) return 'blocked'
  return 'ok'
}

async function main() {
  const args = parseArgs(process.argv)
  loadEnvLocal(ROOT)

  if (!args.token) args.token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() ?? ''
  if (!args.clientId) args.clientId = process.env.SHOPIFY_CLIENT_ID?.trim() ?? ''
  if (!args.clientSecret) args.clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim() ?? ''

  const hasClientCredentials = Boolean(args.clientId && args.clientSecret)
  const hasIncompleteClientCredentials = Boolean(args.clientId) !== Boolean(args.clientSecret)
  const credentialMode = hasClientCredentials
    ? 'client_credentials'
    : args.token
      ? 'admin_token'
      : 'missing'

  const report = {
    status: 'blocked',
    credential_mode: credentialMode,
    admin_api: 'skipped',
    admin_scopes: 'skipped',
    env_local: 'skipped',
    vercel: 'skipped',
    storefront_smoke: 'skipped',
    automated: [],
    pending_human: [],
    errors: [],
    runbook: 'docs/poznamky-agent.json',
    human_doc: 'docs/poznamky.md',
  }

  if (hasIncompleteClientCredentials) {
    report.admin_api = 'missing_credentials'
    report.errors.push('SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be set together')
    report.pending_human.push({
      id: 'shopify_client_credentials',
      message: 'Skopíruj Client ID aj Client secret z Dev Dashboard → Settings',
      url: URLS.dev_dashboard_settings,
    })
    return finish(report)
  }

  if (credentialMode === 'missing') {
    report.admin_api = 'missing_credentials'
    report.errors.push('missing_shopify_admin_credentials')
    report.pending_human.push({
      id: 'shopify_client_credentials',
      message:
        'Nastav SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (preferované) alebo legacy SHOPIFY_ADMIN_ACCESS_TOKEN',
      url: URLS.dev_dashboard_settings,
    })
    return finish(report)
  }

  let accessToken = args.token
  if (credentialMode === 'client_credentials') {
    try {
      accessToken = await fetchClientCredentialsToken(
        CANONICAL_SHOPIFY_STORE,
        args.clientId,
        args.clientSecret,
      )
    } catch (error) {
      report.admin_api = 'credential_exchange_failed'
      report.errors.push(error instanceof Error ? error.message : String(error))
      report.pending_human.push({
        id: 'shopify_client_credentials',
        message: 'Over Client ID/Secret a potvrď aktuálne app scopes v obchode',
        url: URLS.dev_dashboard_settings,
      })
      return finish(report)
    }
  }

  const verify = await verifyAdminTokenRest(accessToken)
  report.admin_api = verify.ok ? 'ok' : verify.code
  if (verify.ok) {
    report.automated.push(
      `Admin API OK: ${verify.shop} (${verify.domain}) [API ${verify.api_version}]`,
    )
  } else {
    report.errors.push(verify.message)
    report.pending_human.push({
      id: verify.code === 'api_version_fallback' ? 'shopify_api_version' : 'shopify_create_token',
      message: verify.message,
      url:
        verify.code === 'api_version_fallback'
          ? URLS.shopify_versioning
          : verify.human_url ?? URLS.develop_apps,
      ...(verify.install_steps ? { install_steps: verify.install_steps } : {}),
    })
    report.status = 'blocked'
    return finish(report)
  }

  const scopeVerify = await verifyAdminScopesGraphql(accessToken)
  report.admin_scopes = scopeVerify.ok ? 'ok' : scopeVerify.code
  if (scopeVerify.ok) {
    report.automated.push(`Admin scopes OK: ${scopeVerify.required.join(', ')}`)
  } else {
    report.errors.push(scopeVerify.message)
    report.pending_human.push({
      id: 'shopify_admin_scopes',
      message: 'Release app verziu so všetkými required scopes a potvrď Update access v obchode',
      url: URLS.dev_dashboard_settings,
      required_scopes: scopeVerify.required,
      missing_scopes: scopeVerify.missing,
    })
    report.status = 'blocked'
    return finish(report)
  }

  if (args.verifyOnly) {
    report.status = 'ok'
    return finish(report)
  }

  const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : ''
  const mistralKey = existing.match(/^MISTRAL_API_KEY=(.+)$/m)?.[1]?.trim()
  const credentialUpdates =
    credentialMode === 'client_credentials'
      ? {
          SHOPIFY_CLIENT_ID: args.clientId,
          SHOPIFY_CLIENT_SECRET: args.clientSecret,
        }
      : { SHOPIFY_ADMIN_ACCESS_TOKEN: args.token }
  upsertEnvLocal(
    {
      ...DEFAULT_ENV_KEYS,
      ...credentialUpdates,
      ...(mistralKey ? { MISTRAL_API_KEY: mistralKey } : {}),
    },
    credentialMode === 'client_credentials' ? ['SHOPIFY_ADMIN_ACCESS_TOKEN'] : [],
  )
  report.env_local = 'ok'
  report.automated.push(`Updated .env.local for ${credentialMode} (chmod 600)`)

  if (args.vercel) {
    if (spawnSync('which', ['vercel'], { stdio: 'ignore' }).status !== 0) {
      report.vercel = 'skipped_no_cli'
      report.errors.push('Vercel CLI not found — skip or npm i -g vercel')
    } else {
      const v = await pushVercelCredentials({
        mode: credentialMode,
        token: args.token,
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        baseEnv: DEFAULT_ENV_KEYS,
      })
      if (v.ok) {
        report.vercel = 'ok'
        report.automated.push(`Vercel ${v.keys.join(' + ')} → ${v.targets.join(', ')}`)
        if (v.legacyCleanup) {
          report.automated.push('Legacy Vercel SHOPIFY_ADMIN_ACCESS_TOKEN absent/removed')
        }
      } else {
        report.vercel = 'error'
        report.errors.push(`Vercel push failed: ${v.key ?? 'credentials'} / ${v.target ?? 'unknown'}`)
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
    message:
      credentialMode === 'client_credentials'
        ? 'Nexus musí používať SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET alebo server-side token exchange'
        : 'Vlož rovnaký SHOPIFY_ADMIN_ACCESS_TOKEN do Nexus (Lovable)',
    url: URLS.nexus_admin,
    env:
      credentialMode === 'client_credentials'
        ? {
            SHOPIFY_STORE_DOMAIN: CANONICAL_SHOPIFY_STORE,
            SHOPIFY_CLIENT_ID: '<Dev Dashboard Client ID>',
            SHOPIFY_CLIENT_SECRET: '<Dev Dashboard Client secret>',
            SHOPIFY_API_VERSION: DEFAULT_SHOPIFY_API_VERSION,
          }
        : {
            SHOPIFY_STORE_DOMAIN: CANONICAL_SHOPIFY_STORE,
            SHOPIFY_ADMIN_ACCESS_TOKEN: '<same shpat_>',
            SHOPIFY_API_VERSION: DEFAULT_SHOPIFY_API_VERSION,
          },
  })

  report.status = determineOnboardingStatus(report, {
    vercelRequired: args.vercel,
    smokeRequired: !args.skipSmoke,
  })
  return finish(report)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    const report = { status: 'error', message: err instanceof Error ? err.message : String(err) }
    if (parseArgs(process.argv).json) console.log(JSON.stringify(report, null, 2))
    else console.error(err)
    process.exit(1)
  })
}
