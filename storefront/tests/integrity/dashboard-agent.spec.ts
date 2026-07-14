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

  test('/dashboard HTML contains command bar in agentic mode', async ({ request }) => {
    test.skip(
      process.env.NEXT_PUBLIC_DASHBOARD_MODE !== 'agentic',
      'Requires NEXT_PUBLIC_DASHBOARD_MODE=agentic',
    )

    const response = await request.get('/dashboard')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('data-testid="dashboard-command-bar"')
    expect(html).toContain('data-testid="dashboard-shell"')
  })
})
