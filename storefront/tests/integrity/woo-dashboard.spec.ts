import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const DASHBOARD_PAGE_PATH = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
const DASHBOARD_FRAME_PATH = path.join(
  process.cwd(),
  'src/components/dashboard/DashboardFrame.tsx',
)

test.describe('Dashboard — WordPress admin iframe', () => {
  test('dashboard page targets DashboardFrame with WP admin URL', () => {
    expect(existsSync(DASHBOARD_PAGE_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_PAGE_PATH, 'utf8')
    expect(content).toContain('<DashboardFrame src={dashboardUrl} />')
    expect(content).toContain('wp-admin')
    expect(content).toContain('data-testid="dashboard-legacy-nexus-link"')
  })

  test('DashboardFrame has sandbox, loading state, and direct link fallback', () => {
    expect(existsSync(DASHBOARD_FRAME_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_FRAME_PATH, 'utf8')
    expect(content).toContain('sandbox=')
    expect(content).toContain('data-testid="dashboard-frame-loading"')
    expect(content).toContain('data-testid="dashboard-direct-link"')
    expect(content).toContain('WordPress admin')
  })

  test('/dashboard returns 200 with iframe markup', async ({ request }) => {
    const response = await request.get('/dashboard')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('dashboard-iframe')
    expect(html).toContain('wp-admin')
  })
})