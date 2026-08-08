/**
 * Forensic regression guards — incidents & drift patterns (2026-07/08).
 * Static checks only; complements woo-catalog + auth-wishlist-gate specs.
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const ROOT = process.cwd()

function read(rel: string): string {
  const full = path.join(ROOT, rel)
  expect(existsSync(full)).toBe(true)
  return readFileSync(full, 'utf8')
}

test.describe('Forensic regression guards', () => {
  test('Woo catalog queries only publish status (draft/private hidden)', () => {
    const products = read('src/lib/wordpress/products.ts')
    expect(products).toContain("status: 'publish'")
  })

  test('Woo env required when WOO_MOCK_MODE is off', () => {
    const env = read('src/lib/env.ts')
    expect(env).toContain('WOO_CONSUMER_KEY')
    expect(env).toContain('WOO_CONSUMER_SECRET')
    expect(env).toContain('WORDPRESS_BASE_URL')
    expect(env).toContain("process.env.WOO_MOCK_MODE === '1'")
  })

  test('cart badge event lives in cart-client (single dispatch point)', () => {
    const cartClient = read('src/lib/catalog/cart-client.ts')
    expect(cartClient).toContain('dispatchCartCountUpdated')
    expect(cartClient).toContain("new CustomEvent('cart-count-updated'")

    const headerHook = read('src/hooks/useCommerceHeaderCounts.ts')
    expect(headerHook).toContain("'cart-count-updated'")
  })

  test('auth pages use Woo BFF routes, not gm_user_session localStorage', () => {
    const login = read('src/app/prihlasenie/page.tsx')
    expect(login).toContain('/api/auth/login')
    expect(login).not.toContain('gm_user_session')

    const profile = read('src/app/profil/page.tsx')
    expect(profile).toContain('/api/auth/me')
    expect(profile).not.toContain('gm_user_session')
  })

  test('ProductCard has no Shopify CDN runtime dependency', () => {
    const card = read('src/components/product/ProductCard.tsx')
    expect(card).toContain('getSizedImageUrl')
    expect(card).not.toContain('getShopifySizedImageUrl')
    expect(card).not.toContain('cdn.shopify.com')
  })

  test('ISR revalidate uses header secret (not query in production)', () => {
    const route = read('src/app/api/revalidate/route.ts')
    expect(route).toContain('x-revalidation-secret')
    expect(route).toContain("process.env.VERCEL_ENV !== 'production'")

    const muPlugin = read('../wordpress/mu-plugins/growmedica-revalidate.php')
    expect(muPlugin).toContain('x-revalidation-secret')
    expect(muPlugin).toContain('/api/revalidate')
  })

  test('CMS recovery scripts exist and avoid hardcoded secrets', () => {
    for (const script of [
      '../scripts/cms-db-recover-from-runtime.py',
      '../scripts/bootstrap-runtime-secrets-env.sh',
      '../scripts/test-cms-connection-full.sh',
    ]) {
      const content = read(script)
      expect(content).not.toMatch(/password\s*=\s*['"][^'"]{8,}['"]/)
      expect(content).not.toMatch(/ck_[a-zA-Z0-9]{10,}/)
    }
  })

  test('dashboard middleware marks route via header (not layout leak)', () => {
    const middleware = read('src/middleware.ts')
    expect(middleware).toContain('DASHBOARD_ROUTE_HEADER')
    expect(middleware).toContain("pathname.startsWith('/dashboard/')")

    const layout = read('src/app/layout.tsx')
    expect(layout).toContain('if (isDashboardRoute)')
  })
})
