import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import robots from '../../src/app/robots'
import { metadata } from '../../src/app/dashboard/layout'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const DASHBOARD_PAGE_PATH = path.join(REPO_ROOT, 'storefront/src/app/dashboard/page.tsx')
const DASHBOARD_SHELL_PATH = path.join(
  REPO_ROOT,
  'storefront/src/components/dashboard/agent/DashboardShell.tsx',
)
const ROOT_LAYOUT_PATH = path.join(REPO_ROOT, 'storefront/src/app/layout.tsx')
const MIDDLEWARE_PATH = path.join(REPO_ROOT, 'storefront/src/middleware.ts')

test.describe('Dashboard route — smoke', () => {
  test('returns 200 structure', () => {
    expect(existsSync(DASHBOARD_PAGE_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_PAGE_PATH, 'utf8')
    expect(content).toContain('export default function DashboardPage')
    expect(content).toContain("import DashboardShell from '@/components/dashboard/agent/DashboardShell'")
    expect(content).toContain('<DashboardShell')
  })

  test('skips shop chrome (no site header or footer)', () => {
    expect(existsSync(MIDDLEWARE_PATH)).toBe(true)
    const middlewareContent = readFileSync(MIDDLEWARE_PATH, 'utf8')
    expect(middlewareContent).toContain("requestHeaders.set(DASHBOARD_ROUTE_HEADER, '1')")
    expect(middlewareContent).toContain("'/dashboard/:path*'")

    expect(existsSync(ROOT_LAYOUT_PATH)).toBe(true)
    const rootLayoutContent = readFileSync(ROOT_LAYOUT_PATH, 'utf8')
    expect(rootLayoutContent).toContain(
      'const isDashboardRoute = isDashboardRouteHeader(headersList.get(DASHBOARD_ROUTE_HEADER))',
    )
    expect(rootLayoutContent).toContain('if (isDashboardRoute) {')

    const isDashboardRouteBranch = rootLayoutContent.match(/if\s*\(isDashboardRoute\)\s*\{([\s\S]*?)\}/)
    expect(isDashboardRouteBranch).toBeTruthy()
    if (isDashboardRouteBranch) {
      const branchContent = isDashboardRouteBranch[1]
      expect(branchContent).not.toContain('<HeaderShell')
      expect(branchContent).not.toContain('<Footer')
      expect(branchContent).not.toContain('<AnnouncementBar')
      expect(branchContent).not.toContain('<TrustStrip')
    }
  })

  test('robots.txt disallows /dashboard', () => {
    const prev = process.env.SITE_NOINDEX
    process.env.SITE_NOINDEX = '0'
    try {
      const robotsConfig = robots()
      const rules = robotsConfig.rules
      const baseRule = Array.isArray(rules) ? rules[0] : rules
      const disallowList = baseRule?.disallow
      expect(disallowList).toContain('/dashboard')
    } finally {
      if (prev === undefined) delete process.env.SITE_NOINDEX
      else process.env.SITE_NOINDEX = prev
    }
  })

  test('DashboardShell uses SecretGate + layout panels', () => {
    expect(existsSync(DASHBOARD_SHELL_PATH)).toBe(true)
    const content = readFileSync(DASHBOARD_SHELL_PATH, 'utf8')
    expect(content).toContain('SecretGate')
    expect(content).toContain('DashboardLayout')
    expect(content).toContain('AgentPanel')
    expect(content).toContain('CommandBar')
  })

  test('contains meta title and robot policies', () => {
    expect(metadata.title).toBe('Dashboard')
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
