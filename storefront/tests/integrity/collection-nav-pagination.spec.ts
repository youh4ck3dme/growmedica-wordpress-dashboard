import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Shopify collection GraphQL pagination tests removed with Shopify runtime.
 * Woo collection views use REST category + product pagination in wordpress/collection-nav.
 */
test.describe('Woo collection navigation pagination (source)', () => {
  test('catalog nav routes to Woo collection view', () => {
    const navPath = path.join(process.cwd(), 'src/lib/catalog/nav.ts')
    const content = fs.readFileSync(navPath, 'utf8')
    expect(content).toContain('getWooCollectionViewByHandle')
    expect(content).toContain('getWooNavCollectionItems')
    expect(content).not.toContain('getShopify')
  })

  test('Woo collection-nav uses page size and pageInfo', () => {
    const wooNav = path.join(process.cwd(), 'src/lib/wordpress/collection-nav.ts')
    const content = fs.readFileSync(wooNav, 'utf8')
    expect(content).toContain('PAGE_SIZE')
    expect(content).toContain('hasNextPage')
    expect(content).toContain('getWooProducts')
    expect(content).toContain("source: 'catalog'")
  })
})
