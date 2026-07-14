import { test, expect } from '@playwright/test'
import coverage from '../fixtures/woo-category-coverage.json'
import { getNavCategories } from '../../src/lib/category-map'

test.describe('WooCommerce catalog — mock mode', () => {
  test('API products returns WooCommerce variant IDs', async ({ request }) => {
    const response = await request.get('/api/products')
    expect(response.ok()).toBe(true)
    const { products } = (await response.json()) as {
      products: Array<{ handle: string; variants: { edges: Array<{ node: { id: string } }> } }>
    }
    expect(products.length).toBeGreaterThan(0)
    expect(products[0].variants.edges[0].node.id).toMatch(/gid:\/\/woocommerce\/ProductVariant\//)
  })

  test('search API finds mock products', async ({ request }) => {
    const response = await request.get('/api/search?q=imunita')
    expect(response.ok()).toBe(true)
    const body = (await response.json()) as { products?: unknown[] }
    expect((body.products ?? []).length).toBeGreaterThan(0)
  })

  test('kolekcie page returns 200', async ({ request }) => {
    const response = await request.get('/kolekcie')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('kolekc')
  })

  test('produkty page returns 200 with catalog', async ({ request }) => {
    const response = await request.get('/produkty')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html.length).toBeGreaterThan(500)
  })

  test('woo category fixture covers 14/14 categories', () => {
    const navCategories = getNavCategories()
    expect(navCategories).toHaveLength(14)
    expect(coverage.coveragePercent).toBe(100)
    expect(Object.keys(coverage.counts)).toHaveLength(14)
    for (const def of navCategories) {
      expect(coverage.counts[def.slug as keyof typeof coverage.counts]).toBeGreaterThan(0)
    }
  })
})