#!/usr/bin/env node
/**
 * Live Mistral smoke test for dashboard agent API.
 *
 * Usage:
 *   MISTRAL_API_KEY=... DASHBOARD_AGENT_SECRET=... node scripts/mistral-agent-live-smoke.mjs
 *   BASE_URL=http://localhost:5555 node scripts/mistral-agent-live-smoke.mjs
 *   BASE_URL=https://www.growmedica.cz node scripts/mistral-agent-live-smoke.mjs
 */
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:5555').replace(/\/$/, '')
const SECRET = process.env.DASHBOARD_AGENT_SECRET ?? 'local-dashboard-agent-secret-min-16-chars'
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY?.trim()
const SKIP_OPTIMIZE_COPY =
  process.env.SKIP_OPTIMIZE_COPY_SMOKE === '1' || process.env.SHOPIFY_STOREFRONT_TOKENLESS === '1'

const commands = ['Zobraz produkty', 'Stav integrácie', 'Súhrn katalógu']

let sessionCookie = ''

function validateCopyQuality(copy) {
  const issues = []
  if (!copy?.title?.trim()) issues.push('missing title')
  if (!copy?.short_description?.trim()) issues.push('missing short_description')
  if (copy?.title?.length < 10) issues.push('title too short')
  if (copy?.short_description?.length < 40) issues.push('short_description too short')
  if (/lieč|vylieč|diagnóz|100[\s%]-?účinn/i.test(`${copy?.title ?? ''} ${copy?.short_description ?? ''}`)) {
    issues.push('compliance violation')
  }
  return issues
}

async function ensureSession() {
  const response = await fetch(`${BASE_URL}/api/dashboard/session`, { method: 'POST' })
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0]
  }
  return response.ok
}

function buildHeaders(useSession) {
  const headers = { 'Content-Type': 'application/json' }
  if (useSession && sessionCookie) {
    headers.Cookie = sessionCookie
  } else {
    headers['x-dashboard-agent-secret'] = SECRET
  }
  return headers
}

async function agentPost(body, useSession = false) {
  return fetch(`${BASE_URL}/api/dashboard/agent`, {
    method: 'POST',
    headers: buildHeaders(useSession),
    body: JSON.stringify(body),
  })
}

async function runOptimizeCopy(handle) {
  let response = await agentPost({ command: `Optimalizuj copy produktu ${handle}` }, Boolean(sessionCookie))
  if (response.status === 401 && !sessionCookie) {
    await ensureSession()
    response = await agentPost({ command: `Optimalizuj copy produktu ${handle}` }, true)
  }
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(`optimize ${handle}: HTTP ${response.status} — ${payload.error ?? JSON.stringify(payload)}`)
  }
  const action = payload.actions?.find((a) => a.tool === 'optimize_product_copy')
  if (!action || action.status !== 'ok') {
    const err = action?.result?.error ?? 'tool failed'
    if (/metafield|unauthenticated_read_metafields/i.test(String(err))) {
      console.warn(`WARN: skip optimize_product_copy — ${err}`)
      return null
    }
    throw new Error(`optimize ${handle}: ${err}`)
  }
  const issues = validateCopyQuality(action.result)
  if (issues.length) {
    throw new Error(`optimize ${handle} quality: ${issues.join(', ')}`)
  }
  return { handle, title: action.result.title, short_description: action.result.short_description }
}

async function runCommand(command) {
  let response = await agentPost({ command }, Boolean(sessionCookie))
  if (response.status === 401) {
    const sessionOk = await ensureSession()
    if (!sessionOk) {
      throw new Error(`${command}: session bootstrap failed`)
    }
    response = await agentPost({ command }, true)
  }

  const body = await response.json()
  if (!response.ok) {
    throw new Error(`${command}: HTTP ${response.status} — ${body.error ?? JSON.stringify(body)}`)
  }
  if (!body.reply || !Array.isArray(body.actions) || body.actions.length === 0) {
    throw new Error(`${command}: invalid response shape`)
  }
  return { command, reply: body.reply, tools: body.actions.map((a) => a.tool), actions: body.actions }
}

async function main() {
  console.log(`Dashboard agent live smoke → ${BASE_URL}`)
  if (!MISTRAL_API_KEY) {
    console.warn('WARN: MISTRAL_API_KEY not set — server must have live Mistral configured')
  }

  const results = []
  for (const command of commands) {
    const result = await runCommand(command)
    results.push(result)
    const failed = result.actions.filter((a) => a.status === 'error')
    if (failed.length) {
      const details = failed.map((a) => `${a.tool}: ${a.result?.error ?? 'error'}`).join('; ')
      throw new Error(`${command} — tool failed: ${details}`)
    }
    console.log(`✓ ${command}`)
    console.log(`  tools: ${result.tools.join(', ')}`)
    console.log(`  reply: ${result.reply.slice(0, 120)}${result.reply.length > 120 ? '…' : ''}`)
  }

  const statusAction = results.find((r) => r.command === 'Stav integrácie')
  if (statusAction && !/live|configured|mock|nakonfigurovan/i.test(statusAction.reply)) {
    console.warn('WARN: integration status reply may not reflect Mistral mode')
  }

  if (SKIP_OPTIMIZE_COPY) {
    console.warn('WARN: skip optimize_product_copy smoke (SHOPIFY_STOREFRONT_TOKENLESS or SKIP_OPTIMIZE_COPY_SMOKE=1)')
  } else {
    const listBody = await agentPost({ command: 'Zobraz produkty' }, Boolean(sessionCookie)).then((r) => r.json())
    const handle = listBody.actions?.find((a) => a.tool === 'list_products')?.result?.products?.[0]?.handle
    if (handle) {
      const copy = await runOptimizeCopy(handle)
      if (copy) {
        console.log(`✓ Optimalizuj copy produktu ${handle}`)
        console.log(`  title: ${copy.title.slice(0, 80)}${copy.title.length > 80 ? '…' : ''}`)
        console.log(`  short: ${copy.short_description.slice(0, 100)}${copy.short_description.length > 100 ? '…' : ''}`)
      }
    } else {
      console.warn('WARN: skip optimize_product_copy smoke — no product handle')
    }
  }

  console.log('\nAll smoke checks passed.')
}

main().catch((error) => {
  console.error('Smoke test failed:', error.message)
  process.exit(1)
})