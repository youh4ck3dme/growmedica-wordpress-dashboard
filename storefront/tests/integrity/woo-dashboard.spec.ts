import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const DASHBOARD_PAGE_PATH = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
const DASHBOARD_SHELL_PATH = path.join(
  process.cwd(),
  'src/components/dashboard/agent/DashboardShell.tsx',
)
const DASHBOARD_FRAME_PATH = path.join(
  process.cwd(),
  'src/components/dashboard/DashboardFrame.tsx',
)

test.describe('Dashboard — WordPress admin iframe', () => {
  test('dashboard page uses DashboardShell with mode and WP URL', () => {
    expect(existsSync(DASHBOARD_PAGE_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_PAGE_PATH, 'utf8')
    expect(content).toContain('<DashboardShell')
    expect(content).toContain('getDashboardMode')
    expect(content).toContain('getDashboardUrl')
  })

  test('DashboardShell supports hybrid tabs and iframe', () => {
    expect(existsSync(DASHBOARD_SHELL_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_SHELL_PATH, 'utf8')
    expect(content).toContain('data-testid="dashboard-tabs"')
    expect(content).toContain('dashboard-tab-wordpress')
    expect(content).toContain('<DashboardFrame')
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

  test('/dashboard returns 200 with hybrid or agentic markup', async ({ request }) => {
    const response = await request.get('/dashboard')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    const mode = process.env.NEXT_PUBLIC_DASHBOARD_MODE ?? 'hybrid'

    if (mode === 'agentic') {
      expect(html).toContain('dashboard-command-bar')
      expect(html).toContain('dashboard-shell')
    } else {
      expect(html).toContain('dashboard-shell')
      if (mode === 'iframe' || mode === 'hybrid') {
        expect(html).toMatch(/dashboard-iframe|dashboard-tab-wordpress|wp-admin/)
      }
    }
  })
})
