import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Shopify inventory repair script safety', () => {
  test('defaults to dry-run and requires --apply for mutations', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/fix-shopify-inventory.mjs')
    expect(fs.existsSync(scriptPath)).toBe(true)
    const scriptContent = fs.readFileSync(scriptPath, 'utf8')
    expect(scriptContent).toContain("const apply = parseArgFlag('--apply')")
    expect(scriptContent).toContain("const dryRun = !apply || parseArgFlag('--dry-run')")
    expect(scriptContent).toContain("dryRun ? ' | DRY-RUN' : ' | APPLY'")

    const packagePath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(packageJson.scripts['inventory:fix']).toContain('--dry-run')
    expect(packageJson.scripts['inventory:fix:apply']).toContain('--apply')
  })
})
