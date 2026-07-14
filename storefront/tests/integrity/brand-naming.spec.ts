import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const PAGES_WITHOUT_LEGACY_NAME = ['/', '/o-nas', '/blog', '/faq', '/produkty', '/kontakt']

// Map path to page.tsx location
function getPageFile(route: string) {
  if (route === '/') return 'src/app/page.tsx'
  return `src/app${route}/page.tsx`
}

test.describe('Brand naming — GrowMedica.sk', () => {
  for (const pagePath of PAGES_WITHOUT_LEGACY_NAME) {
    test(`${pagePath} neobsahuje legacy názov Grow Medical`, async () => {
      const localPath = path.join(process.cwd(), getPageFile(pagePath))
      expect(fs.existsSync(localPath)).toBe(true)
      const content = fs.readFileSync(localPath, 'utf8')
      expect(content).not.toContain('Grow Medical')
    })
  }

  test('homepage obsahuje wordmark Medica', async () => {
    const brandPath = path.join(process.cwd(), 'src/lib/brand.ts')
    const content = fs.readFileSync(brandPath, 'utf8')
    expect(content).toContain('Medica')
  })

  test('/o-nas obsahuje aktualizovaný H1', async () => {
    const brandPath = path.join(process.cwd(), 'src/lib/brand.ts')
    const content = fs.readFileSync(brandPath, 'utf8')
    expect(content).toContain("aboutPageTitle: 'O spoločnosti GrowMedica.sk'")
  })

  test('homepage nemá trust strip', async () => {
    const stripPath = path.join(process.cwd(), 'src/components/layout/TrustStrip.tsx')
    const content = fs.readFileSync(stripPath, 'utf8')
    expect(content).toContain("pathname === '/'")
    expect(content).toContain('return null')
  })

  test('/faq má trust strip', async () => {
    const stripPath = path.join(process.cwd(), 'src/components/layout/TrustStrip.tsx')
    const content = fs.readFileSync(stripPath, 'utf8')
    expect(content).toContain('className="trust-strip"')
    expect(content).toContain('BRAND_COPY.tagline')
  })
})
