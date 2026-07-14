/**
 * Live local WordPress + WooCommerce checks (skip when CMS is down).
 * Run: yarn test:wordpress:local
 */
import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const CREDS_PATH = path.join(process.cwd(), '..', 'wordpress-credentials.local.env')

function loadLocalCreds(): {
  baseUrl: string
  key: string
  secret: string
} | null {
  if (!existsSync(CREDS_PATH)) return null
  const vars: Record<string, string> = {}
  for (const line of readFileSync(CREDS_PATH, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  const baseUrl = vars.WORDPRESS_BASE_URL
  const key = vars.WOO_CONSUMER_KEY
  const secret = vars.WOO_CONSUMER_SECRET
  if (!baseUrl || !key || !secret) return null
  return { baseUrl, key, secret }
}

const creds = loadLocalCreds()

test.describe('WordPress local — live WooCommerce REST', () => {
  test.skip(!creds, 'wordpress-credentials.local.env missing — run scripts/setup-wordpress-local.sh')

  test('WP admin responds 200', async ({ request }) => {
    const response = await request.get(`${creds!.baseUrl}/wp-admin/`)
    expect(response.status()).toBe(200)
  })

  test('WooCommerce products API returns data', async ({ request }) => {
    const url = `${creds!.baseUrl}/wp-json/wc/v3/products?per_page=5&consumer_key=${creds!.key}&consumer_secret=${creds!.secret}`
    const response = await request.get(url)
    expect(response.ok()).toBe(true)
    const products = (await response.json()) as unknown[]
    expect(products.length).toBeGreaterThan(0)
  })

  test('WooCommerce categories API has GrowMedica categories', async ({ request }) => {
    const url = `${creds!.baseUrl}/wp-json/wc/v3/products/categories?per_page=20&consumer_key=${creds!.key}&consumer_secret=${creds!.secret}`
    const response = await request.get(url)
    expect(response.ok()).toBe(true)
    const categories = (await response.json()) as Array<{ slug: string }>
    expect(categories.length).toBeGreaterThanOrEqual(14)
    expect(categories.some((c) => c.slug === 'vitaminy-mineraly')).toBe(true)
  })

  test('WooCommerce customers API has demo customer', async ({ request }) => {
    const url = `${creds!.baseUrl}/wp-json/wc/v3/customers?per_page=5&consumer_key=${creds!.key}&consumer_secret=${creds!.secret}`
    const response = await request.get(url)
    expect(response.ok()).toBe(true)
    const customers = (await response.json()) as Array<{ email: string }>
    expect(customers.some((c) => c.email.includes('growmedica'))).toBe(true)
  })
})