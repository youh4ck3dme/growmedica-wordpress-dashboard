import { test, expect } from '@playwright/test'

const AGENT_SECRET = process.env.DASHBOARD_AGENT_SECRET ?? 'mock-dashboard-agent-secret-123456'
const AGENT_HEADERS = { 'x-dashboard-agent-secret': AGENT_SECRET }

test.describe('Dashboard Agent API', () => {
  test('POST /api/dashboard/agent returns 200 with mock catalog', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zobraz produkty' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.reply).toBeTruthy()
    expect(body.conversation_id).toBeTruthy()
    expect(Array.isArray(body.actions)).toBe(true)
    expect(body.actions.length).toBeGreaterThan(0)
    expect(body.actions[0].tool).toBe('list_products')
  })

  test('invalid secret returns 401', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { 'x-dashboard-agent-secret': 'wrong-secret-value', 'Content-Type': 'application/json' },
      data: { command: 'Zobraz produkty' },
    })
    expect(response.status()).toBe(401)
  })

  test('list_products tool returns products in mock mode', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam produktov' },
    })
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'list_products')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
    expect(action.result.count).toBeGreaterThan(0)
  })

  test('export_catalog_csv returns download path', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Export CSV katalógu' },
    })
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'export_catalog_csv')
    expect(action).toBeTruthy()
    expect(action.result.export_id).toBeTruthy()
    expect(action.result.download_path).toContain('/api/dashboard/export/')
  })

  test('audit log contains entry after agent action', async ({ request }) => {
    await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Stav integrácie' },
    })

    const auditResponse = await request.get('/api/dashboard/audit?limit=10', {
      headers: AGENT_HEADERS,
    })
    expect(auditResponse.ok()).toBe(true)
    const audit = await auditResponse.json()
    expect(audit.entries.length).toBeGreaterThan(0)
    expect(audit.entries[0].tool).toBeTruthy()
  })

  test('catalog_summary tool returns stats', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Súhrn katalógu' },
    })
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'catalog_summary')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
    expect(action.result.product_count).toBeGreaterThan(0)
  })

  test('list_collections tool returns categories', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam kategórií' },
    })
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'list_collections')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
    expect(action.result.count).toBeGreaterThan(0)
  })

  test('list_orders tool returns orders in mock mode', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zobraz posledných 10 objednávok' },
    })
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'list_orders')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
  })

  test('POST /api/dashboard/session with secret header returns ok', async ({ request }) => {
    const response = await request.post('/api/dashboard/session', {
      headers: AGENT_HEADERS,
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.authenticated).toBe(true)
  })

  test('POST /api/dashboard/session without secret returns 401', async ({ request }) => {
    const response = await request.post('/api/dashboard/session')
    expect(response.status()).toBe(401)
  })

  test('GET /api/dashboard/health is public', async ({ request }) => {
    const response = await request.get('/api/dashboard/health')
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.ok).toBe(true)
    // Unauthenticated probe is intentionally minimal (no cms_provider leak).
    expect(body.cms_provider).toBeUndefined()

    const authed = await request.get('/api/dashboard/health', { headers: AGENT_HEADERS })
    expect(authed.ok()).toBe(true)
    const detail = await authed.json()
    expect(detail.ok).toBe(true)
    expect(detail.cms_provider).toBeTruthy()
  })

  test('GET /api/dashboard/products requires auth', async ({ request }) => {
    const authed = await request.get('/api/dashboard/products', { headers: AGENT_HEADERS })
    expect(authed.ok()).toBe(true)

    const denied = await request.get('/api/dashboard/products')
    expect(denied.status()).toBe(401)
  })

  test('optimize_product_copy returns validated SK copy in mock mode', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Optimalizuj copy produktu proteiny-mock-1' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find(
      (a: { tool: string }) => a.tool === 'optimize_product_copy',
    )
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
    expect(action.result.title).toContain('optimalizované')
    expect(action.result.short_description.length).toBeGreaterThanOrEqual(40)
    expect(action.result.short_description).not.toMatch(/lieč/i)
  })

  test('/dashboard HTML contains dashboard title', async ({ request }) => {
    const response = await request.get('/dashboard')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('Dashboard | GrowMedica')
  })
})
