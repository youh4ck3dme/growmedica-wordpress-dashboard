import { test, expect } from '@playwright/test'
import { BRAND_COPY } from '../fixtures/brand'
import { cssUsesPrimaryToken, readGlobalsCss } from '../helpers/globals-css'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Brand UI — layout markup (SSR HTML)', () => {
  test('header používa glass navbar (nie navy)', () => {
    const headerPath = path.join(process.cwd(), 'src/components/layout/GlassNavbar.tsx')
    const content = fs.readFileSync(headerPath, 'utf8')
    expect(content).toContain('glass-navbar')
    expect(content).not.toContain('#1E3A5F')
  })

  test('footer používa brand footer token', () => {
    const footerPath = path.join(process.cwd(), 'src/components/layout/Footer.tsx')
    const content = fs.readFileSync(footerPath, 'utf8')
    expect(content).toContain('site-footer')
  })

  test('logo a navigácia majú stabilné selektory', () => {
    const headerPath = path.join(process.cwd(), 'src/components/layout/GlassNavbar.tsx')
    const searchPath = path.join(process.cwd(), 'src/components/ui/ThemeSearch.tsx')
    const footerPath = path.join(process.cwd(), 'src/components/layout/Footer.tsx')
    
    const headerContent = fs.readFileSync(headerPath, 'utf8')
    const searchContent = fs.readFileSync(searchPath, 'utf8')
    const footerContent = fs.readFileSync(footerPath, 'utf8')
    
    expect(headerContent).toContain('id="site-logo"')
    expect(headerContent).toContain('id="cart-button"')
    expect(searchContent).toContain('id="search-button"')
    expect(footerContent).toMatch(/<footer[^>]*role="contentinfo"/)
  })

  test('logo wordmark GrowMedica.sk je v HTML', () => {
    const logoPath = path.join(process.cwd(), 'src/components/ui/Logo.tsx')
    const content = fs.readFileSync(logoPath, 'utf8')
    expect(content).toContain('className="storefront-logo__grow"')
    expect(content).toContain('className="storefront-logo__accent"')
    expect(content).toContain('className="storefront-logo__tld"')
  })
})

test.describe('Brand UI — homepage copy & structure', () => {
  test('hero nadpis a CTA zodpovedajú brand boardu', () => {
    const sliderPath = path.join(process.cwd(), 'src/components/sections/HeroSlider.tsx')
    const content = fs.readFileSync(sliderPath, 'utf8')
    expect(content).toContain('id="hero-heading"')
    expect(content).toContain('BRAND_COPY.heroTitle')
    expect(content).toContain('BRAND_COPY.heroSubtitle')
    expect(content).toContain('id="hero-cta-primary"')
    expect(content).toContain('BRAND_COPY.heroCta')
  })

  test('USP panel obsahuje všetky 4 value props', () => {
    const badgesPath = path.join(process.cwd(), 'src/components/sections/TrustBadges.tsx')
    const content = fs.readFileSync(badgesPath, 'utf8')
    expect(content).toContain('className="usp-bar')
    for (const label of BRAND_COPY.valueProps) {
      expect(content).toContain(label)
    }
  })

  test('featured sekcia má správny nadpis', () => {
    const homePath = path.join(process.cwd(), 'src/app/page.tsx')
    const content = fs.readFileSync(homePath, 'utf8')
    expect(content).toContain('id="featured-heading"')
    expect(content).toContain('BRAND_COPY.featuredHeading')
  })
})

test.describe('Brand UI — CSS components', () => {
  test('.btn-primary používa teal token (nie hardcoded navy)', () => {
    const css = readGlobalsCss()
    expect(cssUsesPrimaryToken(css, '.btn-primary')).toBe(true)
    expect(css).not.toMatch(/\.btn-primary[\s\S]*?#1[Ee]3[Aa]5[Ff]/)
  })
})

test.describe('Brand UI — meta & accessibility', () => {
  test('theme-color meta je teal', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf8')
    expect(content).toContain('themeColor: BRAND_COPY.themeColor')
  })

  test('html lang je sk', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf8')
    expect(content).toMatch(/lang="sk"/)
  })
})
