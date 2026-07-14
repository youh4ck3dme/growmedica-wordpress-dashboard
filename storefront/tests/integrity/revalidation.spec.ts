import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Shopify webhook revalidation', () => {
  test('accepts Shopify webhook secret via header', async ({ request }) => {
    const routePath = path.join(process.cwd(), 'src/app/api/revalidate/route.ts')
    expect(fs.existsSync(routePath)).toBe(true)
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain("request.headers.get('x-revalidation-secret')")

    const unauthorized = await request.post('/api/revalidate', {
      headers: { 'x-shopify-topic': 'products/update' },
      data: { handle: 'mycomedica-cordyceps-50-90-rastlinnych-kapsul' },
    })
    expect(unauthorized.status()).toBe(401)

    const headerSecretResponse = await request.post('/api/revalidate', {
      headers: {
        'x-revalidation-secret': 'mock-revalidation-secret-123456',
        'x-shopify-topic': 'products/update',
      },
      data: { handle: 'mycomedica-cordyceps-50-90-rastlinnych-kapsul' },
    })
    expect(headerSecretResponse.ok()).toBe(true)
    const body = (await headerSecretResponse.json()) as { revalidated?: boolean }
    expect(body.revalidated).toBe(true)
  })
})
