import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const BASE_ENTITIES_PATH = path.join(REPO_ROOT, 'wpbox/schema/base-entities.yaml')
const MIGRATION_MANIFEST_PATH = path.join(REPO_ROOT, 'wpbox/database/migration-manifest.yaml')

test.describe('Database schema & CPT integrity tests', () => {
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
const DASHBOARD_FRAME_PATH = path.join(REPO_ROOT, 'storefront/src/components/dashboard/DashboardFrame.tsx')

test.describe('Dashboard code & component integrity tests', () => {
  test('dashboard page.tsx is properly structured', () => {
    const content = readFileSync(DASHBOARD_PAGE_PATH, 'utf8')

    // Expect page to import getDashboardUrl and DashboardFrame
    expect(content).toContain("import DashboardFrame from '@/components/dashboard/DashboardFrame'")
    expect(content).toContain("import { getDashboardUrl } from '@/lib/dashboard'")

    // Expect page to render fallback with a direct Nexus link
    expect(content).toContain('data-testid="dashboard-unconfigured"')
    expect(content).toContain('data-testid="dashboard-nexus-direct-link"')
    expect(content).toContain('https://growmedica-nexus.vercel.app/admin/prihlasenie')
  })

  test('DashboardFrame component renders iframe and handles load errors', () => {
    const content = readFileSync(DASHBOARD_FRAME_PATH, 'utf8')

    // Expect frame to render iframe with src, title, and onError
    expect(content).toContain('<iframe')
    expect(content).toContain('src={src}')
    expect(content).toContain('title={title}')
    expect(content).toContain('onError={() => setLoadError(true)}')
    expect(content).toContain('Dashboard sa nepodarilo načítať')
  })
})

