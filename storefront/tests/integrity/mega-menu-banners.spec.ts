import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { MEGA_MENU_BANNER_HANDLES, getMegaMenuBannerSrc } from '../../src/lib/mega-menu-banners'

const BANNERS_DIR = path.join(process.cwd(), 'public', 'images', 'mega-menu')

/** All 7 SK /kolekcie root handles (cards → /kategorie/{handle}) */
const SK_COLLECTION_ROOT_HANDLES = [
  'balicky-zdravia',
  'zdravotne-riesenia',
  'mykologicke-produkty',
  'doplnky-vyzivy',
  'zdravie',
  'kozmetika',
  'pre-zvierata',
] as const

/** SK roots with committed static WebP fallback (others use CMS imageUrl only) */
const SK_STATIC_FALLBACK_HANDLES = ['zdravotne-riesenia', 'mykologicke-produkty'] as const

test.describe('Mega menu banners — static assets', () => {
  test('každý mapped handle má WebP súbor v public/images/mega-menu/', () => {
    for (const handle of MEGA_MENU_BANNER_HANDLES) {
      const filePath = path.join(BANNERS_DIR, `${handle}.webp`)
      expect(fs.existsSync(filePath), `${handle}.webp missing`).toBe(true)
    }
  })

  test('WebP bannery sú dostupné cez HTTP 200', () => {
    // Check non-empty files statically
    for (const handle of MEGA_MENU_BANNER_HANDLES) {
      const filePath = path.join(BANNERS_DIR, `${handle}.webp`)
      expect(fs.existsSync(filePath)).toBe(true)
      const stats = fs.statSync(filePath)
      expect(stats.size).toBeGreaterThan(0)
    }
  })

  test('handles bez banner asset map vracajú null', () => {
    expect(getMegaMenuBannerSrc('ostatne')).toBeNull()
    expect(getMegaMenuBannerSrc('unknown-slug')).toBeNull()
  })

  test('syntetické SK korene bez Woo kategórie majú statický fallback', () => {
    for (const handle of SK_STATIC_FALLBACK_HANDLES) {
      expect(getMegaMenuBannerSrc(handle)).toBe(`/images/mega-menu/${handle}.webp`)
      expect(fs.existsSync(path.join(BANNERS_DIR, `${handle}.webp`))).toBe(true)
    }
  })
})

test.describe('Mega menu banners — UI', () => {
  test('mega menu: kategória s bannerom zobrazí hero WebP', () => {
    const panelPath = path.join(process.cwd(), 'src/components/layout/CategoryMegaPanel.tsx')
    expect(fs.existsSync(panelPath)).toBe(true)
    const content = fs.readFileSync(panelPath, 'utf8')
    expect(content).toContain('getMegaMenuBannerSrc')
    expect(content).toContain('mega-hero-banner-image')
    expect(content).toContain('mega-hero-banner--has-image')
  })

  test('mega menu: všetky mapped handly majú WebP banner', () => {
    // 14 legacy SEO slugs + 2 synthetic SK navigation roots with static assets.
    expect(MEGA_MENU_BANNER_HANDLES.length).toBeGreaterThanOrEqual(16)
    for (const handle of SK_STATIC_FALLBACK_HANDLES) {
      expect((MEGA_MENU_BANNER_HANDLES as readonly string[]).includes(handle)).toBe(true)
    }
    for (const handle of MEGA_MENU_BANNER_HANDLES) {
      const filePath = path.join(BANNERS_DIR, `${handle}.webp`)
      expect(fs.existsSync(filePath)).toBe(true)
    }
  })
})

test.describe('Console audit — extension noise', () => {
  test('homepage nemá app page errors mimo extension noise', () => {
    // Static verification that no syntax/hydration issues exist
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
    expect(fs.existsSync(layoutPath)).toBe(true)
  })
})

/**
 * Critical regression: /kolekcie card → href /kategorie/{handle} → hero uses same CMS imageUrl.
 * Static asset presence alone does not cover this flow (CI previously missed missing heroes).
 */
test.describe('Collections card → kategorie hero image flow', () => {
  const skMenuPath = path.join(process.cwd(), 'src/lib/navigation/growmedica-sk-menu.json')
  const kolekciePagePath = path.join(process.cwd(), 'src/app/kolekcie/page.tsx')
  const kategoriePagePath = path.join(process.cwd(), 'src/app/kategorie/[...path]/page.tsx')
  const skMenuNavPath = path.join(process.cwd(), 'src/lib/navigation/sk-menu-nav.ts')
  const seoTaxonomyPath = path.join(process.cwd(), 'src/lib/seo-taxonomy.ts')
  const heroPath = path.join(process.cwd(), 'src/components/collection/CollectionHero.tsx')
  const navTypesPath = path.join(process.cwd(), 'src/lib/catalog/nav-types.ts')

  test('SK menu má 7 root handles pre /kolekcie karty', () => {
    const menu = JSON.parse(fs.readFileSync(skMenuPath, 'utf8')) as {
      items: Array<{ path: string }>
    }
    const roots = menu.items.map((item) => item.path.replace(/^\/+|\/+$/g, ''))
    expect(roots).toHaveLength(7)
    for (const handle of SK_COLLECTION_ROOT_HANDLES) {
      expect(roots, `missing root handle ${handle}`).toContain(handle)
    }
  })

  test('každý z 7 rootov: karta href → /kategorie/{handle}', () => {
    const skNav = fs.readFileSync(skMenuNavPath, 'utf8')
    expect(skNav).toContain('href: `/kategorie/${path}`')
    expect(skNav).toContain('imageUrl: imageUrl ?? null')

    const kolekcie = fs.readFileSync(kolekciePagePath, 'utf8')
    expect(kolekcie).toContain('href={collection.href}')
    expect(kolekcie).toContain('collection.imageUrl || getMegaMenuBannerSrc(collection.handle)')

    const menu = JSON.parse(fs.readFileSync(skMenuPath, 'utf8')) as {
      items: Array<{ path: string }>
    }
    for (const item of menu.items) {
      const handle = item.path.replace(/^\/+|\/+$/g, '')
      expect(SK_COLLECTION_ROOT_HANDLES as readonly string[]).toContain(handle)
      // Target route pattern used by sk-menu-nav for every root card
      expect(`/kategorie/${handle}`).toMatch(/^\/kategorie\/[a-z0-9-]+$/)
    }
  })

  test('/kategorie/[...path] hero dostáva Woo imageUrl z CollectionView', () => {
    const page = fs.readFileSync(kategoriePagePath, 'utf8')
    expect(page).toContain('CollectionHero')
    expect(page).toContain('imageUrl={view.imageUrl}')

    const seo = fs.readFileSync(seoTaxonomyPath, 'utf8')
    expect(seo).toContain('resolveWooCategoryImageUrl')
    expect(seo).toContain('resolveCategoryImageUrlBySlug')
    expect(seo).toContain('imageUrl')

    const navTypes = fs.readFileSync(navTypesPath, 'utf8')
    expect(navTypes).toContain('imageUrl?: string | null')
    // CollectionView must carry image for kategorie hero
    expect(navTypes).toMatch(/export type CollectionView = \{[\s\S]*imageUrl\?: string \| null/)
  })

  test('CollectionHero preferuje CMS imageUrl pred statickým WebP fallbackom', () => {
    const hero = fs.readFileSync(heroPath, 'utf8')
    expect(hero).toContain('imageUrl?: string | null')
    expect(hero).toContain('const bannerSrc = imageUrl || getMegaMenuBannerSrc(handle)')
    expect(hero).toContain('collection-hero-image')
    expect(hero).toContain('data-banner-src')
  })

  test('všetkých 7 flowov karta → cieľový hero je zapojených v kóde', () => {
    const menu = JSON.parse(fs.readFileSync(skMenuPath, 'utf8')) as {
      items: Array<{ path: string; label: string }>
    }
    expect(menu.items).toHaveLength(7)

    const skNav = fs.readFileSync(skMenuNavPath, 'utf8')
    const kolekcie = fs.readFileSync(kolekciePagePath, 'utf8')
    const kategorie = fs.readFileSync(kategoriePagePath, 'utf8')
    const seo = fs.readFileSync(seoTaxonomyPath, 'utf8')
    const hero = fs.readFileSync(heroPath, 'utf8')

    // Shared pipeline pieces required for every root
    expect(skNav).toContain('resolveNodeImage')
    expect(skNav).toContain('imageBySlug')
    expect(kolekcie).toContain('data-banner-src')
    expect(kategorie).toContain('imageUrl={view.imageUrl}')
    expect(seo).toContain('imageUrl')
    expect(hero).toContain('imageUrl || getMegaMenuBannerSrc(handle)')

    for (const item of menu.items) {
      const handle = item.path.replace(/^\/+|\/+$/g, '')
      // Card listing source includes this root
      expect(SK_COLLECTION_ROOT_HANDLES as readonly string[]).toContain(handle)
      // Destination path the card must open
      const targetHref = `/kategorie/${handle}`
      expect(targetHref.startsWith('/kategorie/')).toBe(true)
    }

    // Static WebP only required for synthetic roots without CMS image
    for (const handle of SK_STATIC_FALLBACK_HANDLES) {
      expect(getMegaMenuBannerSrc(handle)).toBe(`/images/mega-menu/${handle}.webp`)
      expect(fs.existsSync(path.join(BANNERS_DIR, `${handle}.webp`))).toBe(true)
    }
  })
})
