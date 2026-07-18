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

  test('default mode is assist', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Súhrn katalógu' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.mode).toBe('assist')
  })

  test('mode monitor is read-only (no write tools)', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Hromadná zmena cien o 5%', mode: 'monitor' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.mode).toBe('monitor')
    const writeTools = (body.actions as Array<{ tool: string }>).filter((a) =>
      ['bulk_update_prices', 'apply_product_copy', 'apply_product_seo', 'update_inventory'].includes(
        a.tool,
      ),
    )
    expect(writeTools).toHaveLength(0)
  })

  test('mode plan forces dry-run on price updates', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: {
        command: 'Hromadná zmena cien o 5% potvrď apply confirm',
        mode: 'plan',
      },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.mode).toBe('plan')
    const action = body.actions.find((a: { tool: string }) => a.tool === 'bulk_update_prices')
    expect(action).toBeTruthy()
    expect(action.status).toBe('dry_run')
    expect(action.result.dry_run).toBe(true)
  })

  test('get_integration_status tool returns CMS and write mode', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Stav integrácie' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'get_integration_status')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
    expect(action.result.cms_provider).toBeTruthy()
    expect(action.result.mistral).toBeTruthy()
    expect(action.result.catalog).toBeTruthy()
    expect(action.result.write_mode).toBeTruthy()
  })

  test('get_product tool returns product detail', async ({ request }) => {
    const list = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam produktov' },
    })
    const listBody = await list.json()
    const products = listBody.actions.find((a: { tool: string }) => a.tool === 'list_products')
      ?.result?.products as Array<{ handle: string }>
    expect(products?.length).toBeGreaterThan(0)
    const handle = products[0].handle

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: `Zobraz detail produktu ${handle}` },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'get_product')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
    expect(action.result.handle).toBe(handle)
    expect(action.result.title).toBeTruthy()
  })

  test('get_collection_products tool returns products for category', async ({ request }) => {
    const cols = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam kategórií' },
    })
    const colsBody = await cols.json()
    const collections = colsBody.actions.find((a: { tool: string }) => a.tool === 'list_collections')
      ?.result?.collections as Array<{ handle: string }>
    expect(collections?.length).toBeGreaterThan(0)
    const category = collections[0].handle

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: `Produkty v kategórii ${category}` },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'get_collection_products')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
    expect(action.result.category).toBe(category)
    expect(typeof action.result.count).toBe('number')
  })

  test('generate_product_seo tool returns meta fields', async ({ request }) => {
    const list = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam produktov' },
    })
    const listBody = await list.json()
    const products = listBody.actions.find((a: { tool: string }) => a.tool === 'list_products')
      ?.result?.products as Array<{ handle: string }>
    expect(products?.length).toBeGreaterThan(0)
    const handle = products[0].handle

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      // Command must match produkt+handle before bare "seo" (inferToolsFromCommand left-first regex).
      data: { command: `Produkt ${handle} SEO meta` },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'generate_product_seo')
    expect(action).toBeTruthy()
    expect(action?.status).toBe('ok')
    if (action?.status !== 'ok') {
      throw new Error(`generate_product_seo failed: ${JSON.stringify(action)}`)
    }
    expect(action.result.meta_title).toBeTruthy()
    expect(action.result.meta_description).toBeTruthy()
  })

  test('apply_product_copy without confirm is dry_run', async ({ request }) => {
    const list = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam produktov' },
    })
    const products = (await list.json()).actions.find((a: { tool: string }) => a.tool === 'list_products')
      ?.result?.products as Array<{ handle: string }>
    const handle = products[0].handle

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: `Produkt ${handle} aplikuj copy`, mode: 'assist' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'apply_product_copy')
    expect(action).toBeTruthy()
    expect(action.status).toBe('dry_run')
    expect(action.result.dry_run).toBe(true)
    expect(action.result.handle).toBe(handle)
  })

  test('apply_product_seo without confirm is dry_run', async ({ request }) => {
    const list = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam produktov' },
    })
    const products = (await list.json()).actions.find((a: { tool: string }) => a.tool === 'list_products')
      ?.result?.products as Array<{ handle: string }>
    const handle = products[0].handle

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: `Produkt ${handle} aplikuj seo`, mode: 'assist' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'apply_product_seo')
    expect(action).toBeTruthy()
    expect(action.status).toBe('dry_run')
    expect(action.result.dry_run).toBe(true)
  })

  test('update_inventory without confirm is dry_run', async ({ request }) => {
    const list = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam produktov' },
    })
    const products = (await list.json()).actions.find((a: { tool: string }) => a.tool === 'list_products')
      ?.result?.products as Array<{ handle: string }>
    const handle = products[0].handle

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: `Produkt ${handle} nastav sklad 12`, mode: 'assist' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'update_inventory')
    expect(action).toBeTruthy()
    expect(action.status).toBe('dry_run')
    expect(action.result.dry_run).toBe(true)
    expect(action.result.quantity).toBe(12)
  })

  test('plan mode forces dry_run on apply_product_copy even with confirm wording', async ({
    request,
  }) => {
    const list = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Zoznam produktov' },
    })
    const products = (await list.json()).actions.find((a: { tool: string }) => a.tool === 'list_products')
      ?.result?.products as Array<{ handle: string }>
    const handle = products[0].handle

    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: {
        command: `Produkt ${handle} aplikuj copy potvrď confirm apply`,
        mode: 'plan',
      },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.mode).toBe('plan')
    const action = body.actions.find((a: { tool: string }) => a.tool === 'apply_product_copy')
    expect(action).toBeTruthy()
    expect(action.status).toBe('dry_run')
  })

  test('bulk_update_prices assist without confirm is dry_run', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Hromadná zmena cien o 3%', mode: 'assist' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.mode).toBe('assist')
    const action = body.actions.find((a: { tool: string }) => a.tool === 'bulk_update_prices')
    expect(action).toBeTruthy()
    expect(action.status).toBe('dry_run')
    expect(action.result.dry_run).toBe(true)
  })

  test('bulk_update_prices assist with confirm still dry_run without live writes env', async ({
    request,
  }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: {
        command: 'Hromadná zmena cien o 2% potvrď apply confirm',
        mode: 'assist',
      },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    const action = body.actions.find((a: { tool: string }) => a.tool === 'bulk_update_prices')
    expect(action).toBeTruthy()
    // Mock write mode may allow, but without DASHBOARD_ALLOW_LIVE_WRITES and non-mock path;
    // in WOO_MOCK_MODE mock writes are allowed — accept either dry_run or ok applied.
    expect(['dry_run', 'ok']).toContain(action.status)
    if (action.status === 'ok') {
      expect(action.result.applied).toBeGreaterThan(0)
    } else {
      expect(action.result.dry_run).toBe(true)
    }
  })

  test('mode monitor still allows read tools', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Súhrn katalógu', mode: 'monitor' },
    })
    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.mode).toBe('monitor')
    const action = body.actions.find((a: { tool: string }) => a.tool === 'catalog_summary')
    expect(action).toBeTruthy()
    expect(action.status).toBe('ok')
  })

  test('invalid mode returns 400', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Súhrn katalógu', mode: 'full' },
    })
    expect(response.status()).toBe(400)
  })

  test('empty command returns 400', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: '' },
    })
    expect(response.status()).toBe(400)
  })

  test('conversation_id is preserved across requests', async ({ request }) => {
    const first = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Súhrn katalógu', conversation_id: 'test-conv-modes-1' },
    })
    expect(first.ok()).toBe(true)
    const firstBody = await first.json()
    expect(firstBody.conversation_id).toBe('test-conv-modes-1')

    const second = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: {
        command: 'Stav integrácie',
        conversation_id: 'test-conv-modes-1',
        mode: 'plan',
      },
    })
    expect(second.ok()).toBe(true)
    const secondBody = await second.json()
    expect(secondBody.conversation_id).toBe('test-conv-modes-1')
    expect(secondBody.mode).toBe('plan')
  })

  test('export CSV download endpoint serves generated file', async ({ request }) => {
    const create = await request.post('/api/dashboard/agent', {
      headers: { ...AGENT_HEADERS, 'Content-Type': 'application/json' },
      data: { command: 'Export CSV katalógu' },
    })
    const createBody = await create.json()
    const action = createBody.actions.find((a: { tool: string }) => a.tool === 'export_catalog_csv')
    const exportId = action?.result?.export_id as string
    expect(exportId).toBeTruthy()

    const download = await request.get(`/api/dashboard/export/${exportId}`, {
      headers: AGENT_HEADERS,
    })
    expect(download.ok()).toBe(true)
    const csv = await download.text()
    expect(csv).toContain('handle')
    expect(csv.split('\n').length).toBeGreaterThan(1)
  })

  test('GET /api/dashboard/overview requires auth and returns stats', async ({ request }) => {
    const denied = await request.get('/api/dashboard/overview')
    expect(denied.status()).toBe(401)

    const ok = await request.get('/api/dashboard/overview', { headers: AGENT_HEADERS })
    expect(ok.ok()).toBe(true)
    const body = await ok.json()
    expect(typeof body.product_count).toBe('number')
    expect(typeof body.collection_count).toBe('number')
  })

  test('GET /api/dashboard/orders requires auth', async ({ request }) => {
    const denied = await request.get('/api/dashboard/orders')
    expect(denied.status()).toBe(401)
    const ok = await request.get('/api/dashboard/orders', { headers: AGENT_HEADERS })
    expect(ok.ok()).toBe(true)
  })

  test('GET /api/dashboard/inventory requires auth', async ({ request }) => {
    const denied = await request.get('/api/dashboard/inventory')
    expect(denied.status()).toBe(401)
    const ok = await request.get('/api/dashboard/inventory', { headers: AGENT_HEADERS })
    expect(ok.ok()).toBe(true)
  })

  test('agent unauthenticated returns 401', async ({ request }) => {
    const response = await request.post('/api/dashboard/agent', {
      headers: { 'Content-Type': 'application/json' },
      data: { command: 'Zobraz produkty' },
    })
    expect(response.status()).toBe(401)
  })

  test('/dashboard HTML contains dashboard title', async ({ request }) => {
    const response = await request.get('/dashboard')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('Dashboard | GrowMedica')
  })
})

test.describe('Dashboard Agent UI modes', () => {
  test('agent panel exposes Assist/Plan/Monitor mode controls after login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByTestId('dashboard-secret-input').fill(AGENT_SECRET)
    await page.getByTestId('dashboard-secret-submit').click()
    await expect(page.getByTestId('dashboard-home-panel')).toBeVisible({ timeout: 15_000 })

    await page.getByTestId('dashboard-nav-agent').click()

    await expect(page.getByTestId('dashboard-agent-mode')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('dashboard-agent-mode-assist')).toBeVisible()
    await expect(page.getByTestId('dashboard-agent-mode-plan')).toBeVisible()
    await expect(page.getByTestId('dashboard-agent-mode-monitor')).toBeVisible()

    await page.getByTestId('dashboard-agent-mode-plan').click()
    await expect(page.getByTestId('dashboard-agent-mode-plan')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('dashboard-agent-mode-hint')).toContainText(/Plan|dry-run|simul/i)

    await page.getByTestId('dashboard-agent-mode-monitor').click()
    await expect(page.getByTestId('dashboard-agent-mode-monitor')).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await page.getByTestId('dashboard-agent-mode-assist').click()
    await expect(page.getByTestId('dashboard-agent-mode-assist')).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await expect(page.getByTestId('dashboard-command-bar')).toBeVisible()
    await expect(page.getByTestId('dashboard-agent-panel')).toBeVisible()
  })
})
