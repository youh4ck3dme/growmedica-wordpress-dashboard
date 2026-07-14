import { test, expect } from '@playwright/test'
import {
  isValidLocale,
  resolveLocaleFromInput,
  LOCALE_COOKIE,
} from '../../src/lib/i18n'

test.describe('i18n locale detection', () => {
  test('resolveLocaleFromInput maps countries', () => {
    expect(resolveLocaleFromInput({ country: 'SK' })).toBe('sk')
    expect(resolveLocaleFromInput({ country: 'CZ' })).toBe('sk')
    expect(resolveLocaleFromInput({ country: 'DE' })).toBe('de')
    expect(resolveLocaleFromInput({ country: 'AT' })).toBe('de')
    expect(resolveLocaleFromInput({ country: 'CH' })).toBe('de')
    expect(resolveLocaleFromInput({ country: 'US' })).toBe('en')
  })

  test('resolveLocaleFromInput respects cookie over geo', () => {
    expect(
      resolveLocaleFromInput({ cookieLocale: 'sk', country: 'DE' }),
    ).toBe('sk')
  })

  test('resolveLocaleFromInput uses Accept-Language fallback', () => {
    expect(resolveLocaleFromInput({ acceptLanguage: 'de-DE,de;q=0.9' })).toBe('de')
    expect(resolveLocaleFromInput({ acceptLanguage: 'sk-SK,sk;q=0.9' })).toBe('sk')
    expect(resolveLocaleFromInput({ acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('en')
  })

  test('resolveLocaleFromInput defaults to de', () => {
    expect(resolveLocaleFromInput({ defaultLocale: 'de' })).toBe('de')
  })

  test('isValidLocale validates supported locales', () => {
    expect(isValidLocale('sk')).toBe(true)
    expect(isValidLocale('en')).toBe(true)
    expect(isValidLocale('de')).toBe(true)
    expect(isValidLocale('fr')).toBe(false)
  })
})

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

  test('cookie override renders lang=sk', async ({ request }) => {
    const response = await request.get('/', {
      headers: { cookie: `${LOCALE_COOKIE}=sk` },
    })
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toMatch(/lang="sk"/)
  })

  test('GlassNavbar contains locale switcher', async ({ request }) => {
    const response = await request.get('/')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('data-testid="locale-switcher"')
  })
})
