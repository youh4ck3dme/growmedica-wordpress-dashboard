#!/usr/bin/env node
/**
 * Live Mistral smoke test for dashboard agent API.
 * Usage:
 *   MISTRAL_API_KEY=... DASHBOARD_AGENT_SECRET=... node scripts/mistral-agent-live-smoke.mjs
 *   BASE_URL=http://localhost:5555 node scripts/mistral-agent-live-smoke.mjs
 */
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:5555').replace(/\/$/, '')
const SECRET = process.env.DASHBOARD_AGENT_SECRET ?? 'local-dashboard-agent-secret-min-16-chars'
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY?.trim()

const commands = ['Zobraz produkty', 'Stav integrácie', 'Súhrn katalógu']

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

async function runOptimizeCopy(handle) {
  const response = await fetch(`${BASE_URL}/api/dashboard/agent`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ command: `Optimalizuj copy produktu ${handle}` }),
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(`optimize ${handle}: HTTP ${response.status} — ${body.error ?? JSON.stringify(body)}`)
  }
  const action = body.actions?.find((a) => a.tool === 'optimize_product_copy')
  if (!action || action.status !== 'ok') {
    throw new Error(`optimize ${handle}: ${action?.result?.error ?? 'tool failed'}`)
  }
  const issues = validateCopyQuality(action.result)
  if (issues.length) {
    throw new Error(`optimize ${handle} quality: ${issues.join(', ')}`)
  }
  return { handle, title: action.result.title, short_description: action.result.short_description }
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-dashboard-agent-secret': SECRET,
  }
}

async function runCommand(command) {
  const response = await fetch(`${BASE_URL}/api/dashboard/agent`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ command }),
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(`${command}: HTTP ${response.status} — ${body.error ?? JSON.stringify(body)}`)
  }
  if (!body.reply || !Array.isArray(body.actions) || body.actions.length === 0) {
    throw new Error(`${command}: invalid response shape`)
  }
  return { command, reply: body.reply, tools: body.actions.map((a) => a.tool) }
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
    console.log(`✓ ${command}`)
    console.log(`  tools: ${result.tools.join(', ')}`)
    console.log(`  reply: ${result.reply.slice(0, 120)}${result.reply.length > 120 ? '…' : ''}`)
  }

  const statusAction = results.find((r) => r.command === 'Stav integrácie')
  if (statusAction && !/live|configured|mock/i.test(statusAction.reply)) {
    console.warn('WARN: integration status reply may not reflect Mistral mode')
  }

  const listBody = await fetch(`${BASE_URL}/api/dashboard/agent`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ command: 'Zobraz produkty' }),
  }).then((r) => r.json())
  const handle = listBody.actions?.find((a) => a.tool === 'list_products')?.result?.products?.[0]?.handle
  if (handle) {
    const copy = await runOptimizeCopy(handle)
    console.log(`✓ Optimalizuj copy produktu ${handle}`)
    console.log(`  title: ${copy.title.slice(0, 80)}${copy.title.length > 80 ? '…' : ''}`)
    console.log(`  short: ${copy.short_description.slice(0, 100)}${copy.short_description.length > 100 ? '…' : ''}`)
  } else {
    console.warn('WARN: skip optimize_product_copy smoke — no product handle')
  }

  console.log('\nAll smoke checks passed.')
}

main().catch((error) => {
  console.error('Smoke test failed:', error.message)
  process.exit(1)
})
