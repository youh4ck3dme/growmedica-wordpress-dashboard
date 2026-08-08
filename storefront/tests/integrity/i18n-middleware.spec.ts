import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { LOCALE_COOKIE } from '../../src/lib/i18n'

const LANGUAGE_SWITCHER_PATH = path.join(
  process.cwd(),
  'src/components/i18n/LanguageSwitcher.tsx',
)
const GLASS_NAVBAR_PATH = path.join(process.cwd(), 'src/components/layout/GlassNavbar.tsx')

test.describe('i18n middleware integration', () => {
  test('?lang=en sets cookie and redirects', async ({ request }) => {
    const response = await request.get('/?lang=en', { maxRedirects: 0 })
    expect(response.status()).toBeGreaterThanOrEqual(300)
    expect(response.status()).toBeLessThan(400)
    const setCookie = response.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain(`${LOCALE_COOKIE}=en`)
  })

  test('x-vercel-ip-country DE sets growmedica_locale cookie', async ({ request }) => {
    const response = await request.get('/', {
      headers: { 'x-vercel-ip-country': 'DE' },
    })
    expect(response.ok()).toBe(true)
    const setCookie = response.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain(`${LOCALE_COOKIE}=de`)
  })

  test('x-vercel-ip-country CZ sets growmedica_locale=cs cookie', async ({ request }) => {
    const response = await request.get('/', {
      headers: { 'x-vercel-ip-country': 'CZ' },
    })
    expect(response.ok()).toBe(true)
    const setCookie = response.headers()['set-cookie'] ?? ''
    expect(setCookie).toContain(`${LOCALE_COOKIE}=cs`)
  })

  test('cookie override renders lang=sk', async ({ request }) => {
    const response = await request.get('/', {
      headers: { cookie: `${LOCALE_COOKIE}=sk` },
    })
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toMatch(/lang="sk"/)
  })

  test('LanguageSwitcher exposes CS SK EN DE testids (mounted via GlassNavbar)', () => {
    const switcherContent = readFileSync(LANGUAGE_SWITCHER_PATH, 'utf8')
    expect(switcherContent).toContain('data-testid="locale-switcher"')
    expect(switcherContent).toContain('data-testid="locale-switcher-trigger"')
    expect(switcherContent).toContain('locale-switcher-current')
    expect(switcherContent).toContain('locale-switcher-${code}')
    expect(switcherContent).toContain('SUPPORTED_LOCALES.map')

    const navbarContent = readFileSync(GLASS_NAVBAR_PATH, 'utf8')
    expect(navbarContent).toContain('LanguageSwitcher')
  })
})
