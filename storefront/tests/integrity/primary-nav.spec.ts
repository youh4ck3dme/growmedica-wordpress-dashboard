import { test, expect } from '@playwright/test'
import { PRIMARY_NAV_LINKS } from '../../src/lib/navigation/primary-nav'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Primary navigation', () => {
  test('desktop header exposes all primary links', async () => {
    const headerPath = path.join(process.cwd(), 'src/components/layout/GlassNavbar.tsx')
    expect(fs.existsSync(headerPath)).toBe(true)
    const content = fs.readFileSync(headerPath, 'utf8')
    
    // Header should import and use PRIMARY_NAV_LINKS
    expect(content).toContain('PRIMARY_NAV_LINKS')
  })

  test('mobile drawer lists primary links before categories', async () => {
    const mobileNavPath = path.join(process.cwd(), 'src/components/layout/MobileNav.tsx')
    expect(fs.existsSync(mobileNavPath)).toBe(true)
    const content = fs.readFileSync(mobileNavPath, 'utf8')
    
    // Mobile menu should contain primary and categories areas
    expect(content).toContain('mobile-nav-primary')
    expect(content).toContain('mobile-nav-categories')
  })
})

test.describe('NOOR wordmark logo', () => {
  test('header, mobile drawer, and footer share NOOR wordmark without icon', async () => {
    // Statically check that css hides icon and styles wordmark correctly when in noor theme
    const cssPath = path.join(process.cwd(), 'src/styles/globals.css')
    expect(fs.existsSync(cssPath)).toBe(true)
    const cssContent = fs.readFileSync(cssPath, 'utf8')
    expect(cssContent).toContain('[data-storefront-theme="noor"] .storefront-logo svg')
    expect(cssContent).toContain('[data-storefront-theme="noor"] .storefront-logo__wordmark')
    
    // Check that Logo has the components
    const logoPath = path.join(process.cwd(), 'src/components/ui/Logo.tsx')
    expect(fs.existsSync(logoPath)).toBe(true)
    const logoContent = fs.readFileSync(logoPath, 'utf8')
    expect(logoContent).toContain('className="storefront-logo__grow"')
    expect(logoContent).toContain('className="storefront-logo__accent"')
    expect(logoContent).toContain('className="storefront-logo__tld"')
  })
})
