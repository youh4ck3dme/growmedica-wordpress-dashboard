/**
 * Runtime check: register Serwist SW, navigate to /dashboard, assert no FetchEvent network-error.
 */
import { chromium } from 'playwright'
import { appendFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5556'
const LOG = process.env.DEBUG_LOG_PATH ??
  '/Users/erikbabcan/Growmedica-front+DASHBOARD/.cursor/debug-c2eadd.log'

function log(message, data, hypothesisId = 'A') {
  const entry = {
    sessionId: 'c2eadd',
    location: 'debug-dashboard-sw.mjs',
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
    runId: 'post-fix',
  }
  appendFileSync(LOG, `${JSON.stringify(entry)}\n`)
  console.log(message, JSON.stringify(data))
}

const browser = await chromium.launch()
const context = await browser.newContext({ serviceWorkers: 'allow' })
const page = await context.newPage()

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

log('start', { base: BASE })

await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60_000 })
await page.waitForTimeout(2500)

const swUrl = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration()
  return reg?.active?.scriptURL ?? reg?.installing?.scriptURL ?? reg?.waiting?.scriptURL ?? null
})
log('service-worker-registered', { swUrl }, 'E')

const swSource = await page.evaluate(async (url) => {
  if (!url) return null
  const res = await fetch(url)
  const text = await res.text()
  return {
    ok: res.ok,
    hasDashboardBypass: text.includes('/dashboard') && text.includes('NetworkOnly'),
    hasResponseError: text.includes('Response.error'),
    hasDebugSession: text.includes('c2eadd'),
  }
}, swUrl)
log('sw-source-check', swSource, 'A')

const dashResponse = await page.goto(`${BASE}/dashboard`, {
  waitUntil: 'domcontentloaded',
  timeout: 60_000,
})
await page.waitForTimeout(2000)

const fetchEventErrors = consoleErrors.filter((t) =>
  /FetchEvent|network error response|Response\.error/i.test(t),
)

log(
  'dashboard-navigation',
  {
    status: dashResponse?.status() ?? null,
    ok: dashResponse?.ok() ?? false,
    title: await page.title(),
    fetchEventErrors,
    consoleErrorCount: consoleErrors.length,
  },
  'B',
)

await browser.close()

if ((dashResponse?.status() ?? 0) !== 200 || fetchEventErrors.length > 0) {
  process.exitCode = 1
}
