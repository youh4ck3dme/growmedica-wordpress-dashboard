import { test, expect } from '@playwright/test'

function extractHreflangLinks(html: string): Array<{ hrefLang: string; href: string }> {
  const links: Array<{ hrefLang: string; href: string }> = []
  const pattern =
    /<link[^>]+rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html)) !== null) {
    links.push({ hrefLang: match[1], href: match[2] })
  }
  return links
}

test.describe('SEO hreflang HTML output', () => {
  test('homepage renders hreflang links with ?lang= query params', async ({ request }) => {
    const response = await request.get('/')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    const links = extractHreflangLinks(html)

    expect(links.some((l) => l.hrefLang === 'cs-CZ' && l.href.includes('?lang=cs'))).toBe(true)
    expect(links.some((l) => l.hrefLang === 'sk-SK' && l.href.includes('?lang=sk'))).toBe(true)
    expect(links.some((l) => l.hrefLang === 'en' && l.href.includes('?lang=en'))).toBe(true)
    expect(links.some((l) => l.hrefLang === 'de-DE' && l.href.includes('?lang=de'))).toBe(true)
    expect(links.some((l) => l.hrefLang === 'x-default' && l.href.includes('?lang=cs'))).toBe(
      true,
    )

    const cs = links.find((l) => l.hrefLang === 'cs-CZ')
    expect(cs?.href).not.toMatch(/\/\?lang=/)
  })

  test('nested path renders hreflang with lang query on canonical base', async ({ request }) => {
    const response = await request.get('/produkty')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    const links = extractHreflangLinks(html)

    const cs = links.find((l) => l.hrefLang === 'cs-CZ')
    expect(cs?.href).toMatch(/\/produkty\?lang=cs$/)
  })
})
