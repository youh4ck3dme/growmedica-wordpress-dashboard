import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Guards against accidental reintroduction of Shopify runtime / tooling.
 */
test.describe('Shopify fully removed (guard)', () => {
  test('src/lib/shopify directory is gone', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/lib/shopify'))).toBe(false)
  })

  test('no Shopify offline scripts in scripts/', () => {
    const scriptsDir = path.join(process.cwd(), 'scripts')
    const files = fs.readdirSync(scriptsDir)
    const shopifyFiles = files.filter((f) => f.toLowerCase().includes('shopify'))
    expect(shopifyFiles).toEqual([])
  })

  test('package.json has no @shopify/cli and no shopify npm scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    expect(pkg.devDependencies?.['@shopify/cli']).toBeUndefined()
    expect(pkg.dependencies?.['@shopify/cli']).toBeUndefined()
    for (const [name, cmd] of Object.entries(pkg.scripts)) {
      expect(name.toLowerCase().includes('shopify'), `script name ${name}`).toBe(false)
      expect(cmd.toLowerCase().includes('shopify'), `script ${name}=${cmd}`).toBe(false)
    }
  })

  test('cms + catalog are Woo-only', () => {
    const cms = fs.readFileSync(path.join(process.cwd(), 'src/lib/cms.ts'), 'utf8')
    expect(cms).toContain("return 'wordpress'")
    const products = fs.readFileSync(path.join(process.cwd(), 'src/lib/catalog/products.ts'), 'utf8')
    expect(products).toContain('@/lib/wordpress/products')
    expect(products).not.toContain('@/lib/shopify')
  })
})
