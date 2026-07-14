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

test.describe('Dashboard — hybrid AI + Nexus iframe', () => {
  test('dashboard page targets DashboardShell with Nexus iframe tab', () => {
    expect(existsSync(DASHBOARD_PAGE_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_PAGE_PATH, 'utf8')
    expect(content).toContain("import DashboardShell from '@/components/dashboard/agent/DashboardShell'")
    expect(content).toContain('<DashboardShell mode={mode} dashboardUrl={dashboardUrl}')
    expect(content).toMatch(/lovable\.app|NEXUS_DASHBOARD/)
    expect(content).toContain('data-testid="dashboard-legacy-nexus-link"')
  })

  test('DashboardShell embeds Nexus iframe via DashboardFrame', () => {
    expect(existsSync(DASHBOARD_SHELL_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_SHELL_PATH, 'utf8')
    expect(content).toContain('<DashboardFrame src={dashboardUrl}')
    expect(content).toContain('testId="dashboard-tab-nexus"')
    expect(content).toContain("t('dashboard.tab.nexus')")
  })

  test('DashboardFrame has sandbox, loading state, and direct link fallback', () => {
    expect(existsSync(DASHBOARD_FRAME_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_FRAME_PATH, 'utf8')
    expect(content).toContain('sandbox=')
    expect(content).toContain('data-testid="dashboard-frame-loading"')
    expect(content).toContain('data-testid="dashboard-direct-link"')
    expect(content).toMatch(/Nexus|lovable/i)
  })

  test('/dashboard returns 200 with hybrid shell markup', async ({ request }) => {
    const response = await request.get('/dashboard')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('dashboard-shell')
    expect(html).toContain('dashboard-command-bar')
    expect(html).toContain('dashboard-tab-nexus')
  })
})
