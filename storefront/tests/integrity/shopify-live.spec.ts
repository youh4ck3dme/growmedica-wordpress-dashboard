import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const root = process.cwd()

test.describe('Shopify live catalog scripts', () => {
  test('shopify-smoke-test.mjs exists and validates shpat_ rejection', () => {
    const scriptPath = path.join(root, 'scripts/shopify-smoke-test.mjs')
    expect(existsSync(scriptPath)).toBe(true)
    const content = readFileSync(scriptPath, 'utf8')
    expect(content).toContain('shpat_')
    expect(content).toContain('Storefront API')
    expect(content).toContain('growmedica.myshopify.com')
  })

  test('set-shopify-vercel-env.sh sets CMS_PROVIDER=shopify', () => {
    const scriptPath = path.join(root, 'scripts/set-shopify-vercel-env.sh')
    expect(existsSync(scriptPath)).toBe(true)
    const content = readFileSync(scriptPath, 'utf8')
    expect(content).toContain('CMS_PROVIDER="${CMS_PROVIDER:-shopify}"')
    expect(content).toContain('SHOPIFY_MOCK_MODE')
    expect(content).toContain('SHOPIFY_STOREFRONT_TOKENLESS')
    expect(content).toContain('growmedica.myshopify.com')
  })

  test('setup-env.sh writes CMS_PROVIDER=shopify', () => {
    const scriptPath = path.join(root, 'scripts/setup-env.sh')
    const content = readFileSync(scriptPath, 'utf8')
    expect(content).toContain('CMS_PROVIDER=shopify')
    expect(content).toContain('shopify-smoke-test.mjs')
  })

  test('SHOPIFY_LIVE.md documents token types', () => {
    const docPath = path.join(root, 'docs/SHOPIFY_LIVE.md')
    expect(existsSync(docPath)).toBe(true)
    const content = readFileSync(docPath, 'utf8')
    expect(content).toContain('Storefront API')
    expect(content).toContain('shpat_')
    expect(content).toContain('Nexus')
  })

  test('setup-shopify-env-noninteractive.sh validates shpat_', () => {
    const scriptPath = path.join(root, 'scripts/setup-shopify-env-noninteractive.sh')
    expect(existsSync(scriptPath)).toBe(true)
    const content = readFileSync(scriptPath, 'utf8')
    expect(content).toContain('shpat_')
    expect(content).toContain('SHOPIFY_STOREFRONT_TOKENLESS')
    expect(content).toContain('CMS_PROVIDER=shopify')
  })

  test('shopify config supports tokenless Storefront headers', () => {
    const configPath = path.join(root, 'src/lib/shopify/config.ts')
    expect(existsSync(configPath)).toBe(true)
    const content = readFileSync(configPath, 'utf8')
    expect(content).toContain('SHOPIFY_STOREFRONT_TOKENLESS')
    expect(content).toContain('X-Shopify-Storefront-Access-Token')
  })
})
