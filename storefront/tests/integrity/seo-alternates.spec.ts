import { test, expect } from '@playwright/test'
import {
  buildCanonicalPageUrl,
  buildHreflangLinks,
  buildLocaleAlternates,
} from '@/lib/seo'

const SITE = 'https://growmedica.cz'

test.describe('SEO locale alternates', () => {
  test('root canonical and hreflang share the same base URL (no trailing slash)', () => {
    const alternates = buildLocaleAlternates('/', SITE)
    const links = buildHreflangLinks('/', SITE)
    const byLang = Object.fromEntries(links.map((l) => [l.hrefLang, l.href]))

    expect(alternates?.canonical).toBe(SITE)
    expect(byLang['sk-SK']).toBe(`${SITE}?lang=sk`)
    expect(byLang['en']).toBe(`${SITE}?lang=en`)
    expect(byLang['de-DE']).toBe(`${SITE}?lang=de`)
    expect(byLang['x-default']).toBe(`${SITE}?lang=sk`)
  })

  test('nested paths append lang query to the same canonical base', () => {
    const alternates = buildLocaleAlternates('/produkty/energy-renol', SITE)
    const links = buildHreflangLinks('/produkty/energy-renol', SITE)
    const sk = links.find((l) => l.hrefLang === 'sk-SK')

    expect(alternates?.canonical).toBe(`${SITE}/produkty/energy-renol`)
    expect(sk?.href).toBe(`${SITE}/produkty/energy-renol?lang=sk`)
  })

  test('buildCanonicalPageUrl normalizes pathname without leading slash', () => {
    expect(buildCanonicalPageUrl('balicky', SITE)).toBe(`${SITE}/balicky`)
    expect(buildCanonicalPageUrl('/', SITE)).toBe(SITE)
  })
})
