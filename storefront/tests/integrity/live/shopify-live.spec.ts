import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Shopify live integration suite retired — runtime is WooCommerce-only.
 * These checks guard against accidental reintroduction of Shopify runtime paths.
 */
test.describe('Shopify runtime removed', () => {
  test('src/lib/shopify directory is gone', () => {
    const shopifyDir = path.join(process.cwd(), 'src/lib/shopify')
    expect(fs.existsSync(shopifyDir)).toBe(false)
  })

  test('cms provider is wordpress-only', () => {
    const cmsPath = path.join(process.cwd(), 'src/lib/cms.ts')
    const content = fs.readFileSync(cmsPath, 'utf8')
    expect(content).toContain("return 'wordpress'")
    expect(content).not.toMatch(/forced === 'shopify'/)
  })

  test('catalog products does not import Shopify products module', () => {
    const productsPath = path.join(process.cwd(), 'src/lib/catalog/products.ts')
    const content = fs.readFileSync(productsPath, 'utf8')
    expect(content).toContain('@/lib/wordpress/products')
    expect(content).not.toContain('@/lib/shopify/products')
  })
})
