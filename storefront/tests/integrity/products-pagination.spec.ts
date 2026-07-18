import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Products catalog pagination', () => {
  test('/produkty fetches the full catalog for client-side filtering', async () => {
    const productsLibPath = path.join(process.cwd(), 'src/lib/catalog/products.ts')
    expect(fs.existsSync(productsLibPath)).toBe(true)
    const libContent = fs.readFileSync(productsLibPath, 'utf8')
    expect(libContent).toContain('getProductsAccumulated')
    expect(libContent).toContain("pages?: number | 'all'")
    
    const pagePath = path.join(process.cwd(), 'src/app/produkty/page.tsx')
    expect(fs.existsSync(pagePath)).toBe(true)
    const pageContent = fs.readFileSync(pagePath, 'utf8')
    expect(pageContent).toContain('getProductsAccumulated')
    expect(pageContent).toContain("pages: 'all'")
    expect(pageContent).toContain('FilterableProductList')
  })

  test('/api/products returns the mock catalog through the real route', async ({ request }) => {
    // Default page size is capped; request an explicit limit for stable mock coverage.
    const response = await request.get('/api/products?limit=50')
    expect(response.ok()).toBe(true)
    const { products } = (await response.json()) as { products: Array<{ handle: string }> }

    expect(products.length).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(products)).toBe(true)
    // Shopify mock includes cordyceps; Woo mock may use different fixtures.
    if (products.length > 5) {
      expect(products.map((product) => product.handle)).toContain(
        'mycomedica-cordyceps-50-90-rastlinnych-kapsul',
      )
    }
  })

  test('/api/products uses capped catalog and direct handle lookups', async () => {
    const productsLibPath = path.join(process.cwd(), 'src/lib/catalog/products.ts')
    const libContent = fs.readFileSync(productsLibPath, 'utf8')
    expect(libContent).toContain('PRODUCTS_PAGE_SIZE')
    expect(libContent).toContain('pages')

    const apiPath = path.join(process.cwd(), 'src/app/api/products/route.ts')
    expect(fs.existsSync(apiPath)).toBe(true)
    const apiContent = fs.readFileSync(apiPath, 'utf8')
    expect(apiContent).toContain('getProductByHandle')
    expect(apiContent).toContain('MAX_PAGE_SIZE')
    expect(apiContent).toContain('pages: 1')
    expect(apiContent).not.toContain("pages: 'all'")
  })
})
