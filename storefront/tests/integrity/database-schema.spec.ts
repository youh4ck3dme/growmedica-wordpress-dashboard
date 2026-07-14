import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const BASE_ENTITIES_PATH = path.join(REPO_ROOT, 'wpbox/schema/base-entities.yaml')
const MIGRATION_MANIFEST_PATH = path.join(REPO_ROOT, 'wpbox/database/migration-manifest.yaml')
const hasWpbox = existsSync(BASE_ENTITIES_PATH) && existsSync(MIGRATION_MANIFEST_PATH)

test.describe('Database schema & CPT integrity tests', () => {
  test.skip(!hasWpbox, 'wpbox/ not present in standalone storefront repo')

  test('base-entities.yaml contains all diagnostics CPTs', () => {
    const content = readFileSync(BASE_ENTITIES_PATH, 'utf8')

    const requiredEntities = [
      'diagnosticReports',
      'anomalies',
      'recommendations',
      'devices',
      'performanceMetrics',
      'uiUxIssues',
      'users',
    ]

    for (const entity of requiredEntities) {
      expect(content).toContain(`${entity}:`)
    }
  })

  test('base-entities.yaml maps correct tables for CPTs', () => {
    const content = readFileSync(BASE_ENTITIES_PATH, 'utf8')

    const requiredTableMappings = [
      'table: wp_diagnostic_reports',
      'table: wp_anomalies',
      'table: wp_recommendations',
      'table: wp_devices',
      'table: wp_performance_metrics',
      'table: wp_ui_ux_issues',
      'table: wp_users',
    ]

    for (const mapping of requiredTableMappings) {
      expect(content).toContain(mapping)
    }
  })

  test('migration-manifest.yaml contains diagnostic tables in create_tables', () => {
    const content = readFileSync(MIGRATION_MANIFEST_PATH, 'utf8')

    const requiredTables = [
      'wp_diagnostic_reports',
      'wp_anomalies',
      'wp_recommendations',
      'wp_devices',
      'wp_performance_metrics',
      'wp_ui_ux_issues',
      'wp_users',
    ]

    for (const table of requiredTables) {
      expect(content).toContain(`- table: ${table}`)
    }
  })
})

const DASHBOARD_PAGE_PATH = path.join(REPO_ROOT, 'storefront/src/app/dashboard/page.tsx')
const DASHBOARD_SHELL_PATH = path.join(
  REPO_ROOT,
  'storefront/src/components/dashboard/agent/DashboardShell.tsx',
)
const DASHBOARD_FRAME_PATH = path.join(
  REPO_ROOT,
  'storefront/src/components/dashboard/DashboardFrame.tsx',
)

test.describe('Dashboard code & component integrity tests', () => {
  test('dashboard page.tsx is properly structured', () => {
    const content = readFileSync(DASHBOARD_PAGE_PATH, 'utf8')

    expect(content).toContain("import DashboardShell from '@/components/dashboard/agent/DashboardShell'")
    expect(content).toContain("import { getDashboardMode, getDashboardUrl } from '@/lib/dashboard'")
    expect(content).toContain('data-testid="dashboard-unconfigured"')
    expect(content).toContain('NEXT_PUBLIC_DASHBOARD_MODE=agentic')
    expect(content).toContain('wp-admin')
  })

  test('DashboardShell supports iframe and agentic modes', () => {
    const content = readFileSync(DASHBOARD_SHELL_PATH, 'utf8')
    expect(content).toContain('data-testid="dashboard-shell"')
    expect(content).toContain('DashboardFrame')
    expect(content).toContain('AgentPanel')
  })

  test('DashboardFrame component renders iframe and handles load errors', () => {
    const content = readFileSync(DASHBOARD_FRAME_PATH, 'utf8')

    expect(content).toContain('<iframe')
    expect(content).toContain('src={src}')
    expect(content).toContain('title={title}')
    expect(content).toContain('onError={() => {')
    expect(content).toContain('setLoadError(true)')
    expect(content).toContain('WordPress admin')
    expect(content).toContain('sandbox=')
  })
})