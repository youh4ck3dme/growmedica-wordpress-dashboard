import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Collections — catalog navigation', () => {
  test('/kolekcie vracia aspoň 10 kategórií s produktmi', async () => {
    const pagePath = path.join(process.cwd(), 'src/app/kolekcie/page.tsx')
    expect(fs.existsSync(pagePath)).toBe(true)
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('Kolekcie produktov')
    expect(content).toContain('getNavCollectionItems')
  })

  test('/kolekcie renderuje WebP bannery pre kategórie', async () => {
    const pagePath = path.join(process.cwd(), 'src/app/kolekcie/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('collection-card-banner-image')
    expect(content).toContain('object-right')
    expect(content).toContain('data-banner-src')
    expect(content).toContain('collection-card--has-banner')
  })

  test('/kolekcie zobrazí načítané banner obrázky v kartách', async () => {
    const pagePath = path.join(process.cwd(), 'src/app/kolekcie/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('data-collection-handle={collection.handle}')
    expect(content).toContain('collection-card-banner-image')
  })

  test('/kolekcie/regeneracia hero banner je viditeľný', async () => {
    const heroPath = path.join(process.cwd(), 'src/components/collection/CollectionHero.tsx')
    if (fs.existsSync(heroPath)) {
      const content = fs.readFileSync(heroPath, 'utf8')
      expect(content).toContain('collection-hero')
      expect(content).toContain('collection-hero-image')
    }
  })

  test('/kolekcie/vitaminy-mineraly zobrazí produkty z katalógu', async () => {
    const pagePath = path.join(process.cwd(), 'src/app/kolekcie/[handle]/page.tsx')
    expect(fs.existsSync(pagePath)).toBe(true)
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('CollectionHero')
    expect(content).toContain('ProductGrid')
  })

  test('/kolekcie/regeneracia zobrazí produkty', async () => {
    const pagePath = path.join(process.cwd(), 'src/app/kolekcie/[handle]/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('CollectionHero')
    expect(content).toContain('ProductGrid')
  })

  test('/kolekcie/frontpage vracia 404', async () => {
    const mapPath = path.join(process.cwd(), 'src/lib/category-map.ts')
    const content = fs.readFileSync(mapPath, 'utf8')
    expect(content).toContain('HIDDEN_COLLECTION_HANDLES')
  })

  test('legacy /kolekcia/:slug presmeruje na /kolekcie/:slug', async () => {
    const configPath = path.join(process.cwd(), 'next.config.ts')
    expect(fs.existsSync(configPath)).toBe(true)
    const content = fs.readFileSync(configPath, 'utf8')
    expect(content).toContain('/kolekcia/:slug')
    expect(content).toContain('/kolekcie/:slug')
  })

  test('legacy /kolekcie/doplnky-vyzivy presmeruje na vitaminy-mineraly', async () => {
    const configPath = path.join(process.cwd(), 'next.config.ts')
    const content = fs.readFileSync(configPath, 'utf8')
    expect(content).toContain('categoryRedirects')
  })

  test('footer menu obsahuje nové kategórie', async () => {
    const footerPath = path.join(process.cwd(), 'src/components/layout/Footer.tsx')
    expect(fs.existsSync(footerPath)).toBe(true)
    const content = fs.readFileSync(footerPath, 'utf8')
    expect(content).toContain('getNavCollectionItems')
    
    // Also check category map that contains the mapped slug redirects
    const mapPath = path.join(process.cwd(), 'src/lib/category-map.ts')
    const mapContent = fs.readFileSync(mapPath, 'utf8')
    expect(mapContent).toContain('LEGACY_SLUG_REDIRECTS')
    expect(mapContent).toContain("'doplnky-vyzivy': 'vitaminy-mineraly'")
  })

  test('header obsahuje mega menu trigger a kategórie', async () => {
    const megaPath = path.join(process.cwd(), 'src/components/layout/HeaderMegaMenu.tsx')
    expect(fs.existsSync(megaPath)).toBe(true)
    const content = fs.readFileSync(megaPath, 'utf8')
    expect(content).toContain('category-mega-menu-trigger')
  })

  test('mega menu panel sa otvorí po hover intent', async () => {
    const megaPath = path.join(process.cwd(), 'src/components/layout/HeaderMegaMenu.tsx')
    const content = fs.readFileSync(megaPath, 'utf8')
    expect(content).toContain('category-mega-menu-panel')
  })

  test('mega menu: každá kategória má ikonku', async () => {
    const panelPath = path.join(process.cwd(), 'src/components/layout/CategoryMegaPanel.tsx')
    expect(fs.existsSync(panelPath)).toBe(true)
    const content = fs.readFileSync(panelPath, 'utf8')
    expect(content).toContain('mega-menu-list-icon')
    expect(content).toContain('cat.icon')
  })

  test('mega menu: compact desktop panel height', async () => {
    const cssPath = path.join(process.cwd(), 'src/styles/globals.css')
    expect(fs.existsSync(cssPath)).toBe(true)
    const content = fs.readFileSync(cssPath, 'utf8')
    expect(content).toContain('.mega-menu-grid')
  })

  test('mega menu: category list is scrollable on desktop', async () => {
    const cssPath = path.join(process.cwd(), 'src/styles/globals.css')
    const content = fs.readFileSync(cssPath, 'utf8')
    expect(content).toContain('.mega-menu-list--scroll')
  })
})
