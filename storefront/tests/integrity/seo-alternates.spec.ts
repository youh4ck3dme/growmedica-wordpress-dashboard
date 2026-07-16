import { test, expect } from '@playwright/test'
import {
  buildCanonicalPageUrl,
  buildHreflangLinks,
  buildLocaleAlternates,
} from '@/lib/seo'

const SITE = 'https://www.growmedica.cz'

test.describe('SEO locale alternates', () => {
  test('root canonical and hreflang share the same base URL', () => {
    const alternates = buildLocaleAlternates('/', SITE)
    const links = buildHreflangLinks('/', SITE)
    const byLang = Object.fromEntries(links.map((l) => [l.hrefLang, l.href]))

    expect(alternates?.canonical).toBe(SITE)
    // Root hreflang uses trailing slash before query (PSI / crawl-friendly)
    expect(byLang['cs-CZ']).toBe(`${SITE}/?lang=cs`)
    expect(byLang['sk-SK']).toBe(`${SITE}/?lang=sk`)
    expect(byLang['en']).toBe(`${SITE}/?lang=en`)
    expect(byLang['de-DE']).toBe(`${SITE}/?lang=de`)
    expect(byLang['x-default']).toBe(`${SITE}/?lang=cs`)
  })

  test('nested paths append lang query to the same canonical base', () => {
    const alternates = buildLocaleAlternates('/produkty/energy-renol', SITE)
    const links = buildHreflangLinks('/produkty/energy-renol', SITE)
    const cs = links.find((l) => l.hrefLang === 'cs-CZ')

    expect(alternates?.canonical).toBe(`${SITE}/produkty/energy-renol`)
    expect(cs?.href).toBe(`${SITE}/produkty/energy-renol?lang=cs`)
  })

  test('buildCanonicalPageUrl normalizes pathname without leading slash', () => {
    expect(buildCanonicalPageUrl('balicky', SITE)).toBe(`${SITE}/balicky`)
    expect(buildCanonicalPageUrl('/', SITE)).toBe(SITE)
  })
})
