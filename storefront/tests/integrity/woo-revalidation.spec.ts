import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { wooTestEnv } from '../helpers/woo-env'

const revalidationSecret = wooTestEnv.WORDPRESS_REVALIDATION_SECRET

test.describe('WordPress WooCommerce ISR revalidation', () => {
  test('revalidates woo-product tag via query secret', async ({ request }) => {
    const routePath = path.join(process.cwd(), 'src/app/api/revalidate/route.ts')
    expect(fs.existsSync(routePath)).toBe(true)
    const content = fs.readFileSync(routePath, 'utf8')
    expect(content).toContain('woo-product-')
    expect(content).toContain("searchParams.get('tag')")

    const response = await request.post(
      `/api/revalidate?secret=${revalidationSecret}&tag=woo-product-imunita-mock-1`,
    )
    expect(response.ok()).toBe(true)
    const body = (await response.json()) as {
      revalidated?: boolean
      provider?: string
      tags?: string[]
    }
    expect(body.revalidated).toBe(true)
    expect(body.provider).toBe('wordpress')
    expect(body.tags).toContain('woo-product-imunita-mock-1')
    expect(body.tags).toContain('woo-products')
  })

  test('revalidates woo-category tag via query secret', async ({ request }) => {
    const response = await request.post(
      `/api/revalidate?secret=${revalidationSecret}&tag=woo-category-imunita`,
    )
    expect(response.ok()).toBe(true)
    const body = (await response.json()) as { tags?: string[] }
    expect(body.tags).toContain('woo-category-imunita')
    expect(body.tags).toContain('woo-categories')
  })

  test('rejects invalid woo tag', async ({ request }) => {
    const response = await request.post(
      `/api/revalidate?secret=${revalidationSecret}&tag=invalid-tag`,
    )
    expect(response.ok()).toBe(true)
    const body = (await response.json()) as { tags?: string[] }
    expect(body.tags).toEqual([])
  })
})