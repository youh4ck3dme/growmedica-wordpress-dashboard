import { test, expect } from '@playwright/test'
import { validateProductCopyOutput } from '@/lib/dashboard-agent/copyQuality'

const AGENT_SECRET = process.env.DASHBOARD_AGENT_SECRET ?? 'mock-dashboard-agent-secret-123456'
const AGENT_HEADERS = { 'x-dashboard-agent-secret': AGENT_SECRET }
const hasLiveMistral = Boolean(process.env.MISTRAL_API_KEY?.trim())

test.describe('Dashboard Agent — live Mistral', () => {
  test.beforeEach(() => {
    test.skip(!hasLiveMistral, 'Requires MISTRAL_API_KEY for live Mistral test')
    test.skip(process.env.MISTRAL_MOCK_MODE === '1', 'Set MISTRAL_MOCK_MODE=0 for live test')
  })

  test('POST /api/dashboard/agent returns live reply for list products', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zobraz produkty' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.reply).toBeTruthy()
    expect(body.actions.some((a: { tool: string }) => a.tool === 'list_products')).toBe(true)
  })

  test('integration status reflects configured Mistral', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Stav integrácie' },
    })
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'get_integration_status')
    expect(action?.result?.mistral).toBe('configured')
  })

  test('catalog_summary tool works', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Súhrn katalógu' },
    })
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'catalog_summary')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
  })

  test('optimize_product_copy returns SK copy passing quality checks (E4)', async ({ request }) => {
    const listResponse = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zobraz produkty' },
    })
    const listBody = await listResponse.json()
    const listAction = listBody.actions.find((a: { tool: string }) => a.tool === 'list_products')
    const handle = listAction?.result?.products?.[0]?.handle as string | undefined
    expect(handle).toBeTruthy()

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: `Optimalizuj copy produktu ${handle}` },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find(
      (a: { tool: string }) => a.tool === 'optimize_product_copy',
    )
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')

    const quality = validateProductCopyOutput({
      title: action.result.title,
      short_description: action.result.short_description,
    })
    expect(quality.ok, quality.issues.join('; ')).toBe(true)
    expect(action.result.title).not.toMatch(/lieč|vylieč|diagnóz/i)
  })
})
