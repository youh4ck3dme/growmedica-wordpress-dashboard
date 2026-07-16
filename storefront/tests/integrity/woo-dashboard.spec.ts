import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const DASHBOARD_PAGE_PATH = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
const DASHBOARD_SHELL_PATH = path.join(
  process.cwd(),
  'src/components/dashboard/agent/DashboardShell.tsx',
)
const DASHBOARD_LAYOUT_PATH = path.join(
  process.cwd(),
  'src/components/dashboard/layout/DashboardLayout.tsx',
)

test.describe('Dashboard — agent shell (Woo era)', () => {
  test('dashboard page mounts DashboardShell', () => {
    expect(existsSync(DASHBOARD_PAGE_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_PAGE_PATH, 'utf8')
    expect(content).toContain("import DashboardShell from '@/components/dashboard/agent/DashboardShell'")
    expect(content).toContain('<DashboardShell')
  })

  test('DashboardShell gates with SecretGate and has agent UI', () => {
    expect(existsSync(DASHBOARD_SHELL_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_SHELL_PATH, 'utf8')
    expect(content).toContain('SecretGate')
    expect(content).toContain('AgentPanel')
    expect(content).toContain('CommandBar')
    expect(content).toContain('IntegrationStatus')
  })

  test('DashboardLayout defines panel views', () => {
    expect(existsSync(DASHBOARD_LAYOUT_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_LAYOUT_PATH, 'utf8')
    expect(content).toMatch(/home|products|orders|inventory|agent/i)
  })

  test('/dashboard returns 200', async ({ request }) => {
    const response = await request.get('/dashboard')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    // Secret gate or shell present
    expect(html.length).toBeGreaterThan(200)
  })
})
