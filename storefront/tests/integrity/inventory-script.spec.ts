import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Shopify inventory scripts removed', () => {
  test('fix-shopify-inventory script is gone', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/fix-shopify-inventory.mjs')
    expect(fs.existsSync(scriptPath)).toBe(false)
  })

  test('package.json has no Shopify inventory scripts', () => {
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(packageJson.scripts['inventory:fix']).toBeUndefined()
    expect(packageJson.scripts['shopify:smoke']).toBeUndefined()
    expect(packageJson.scripts['import:shopify-to-woo']).toBeUndefined()
  })
})
