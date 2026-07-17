import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const root = process.cwd()
const swSourcePath = path.join(root, 'src/app/sw.ts')
const manifestPath = path.join(root, 'public/manifest.webmanifest')
const offlineHtmlPath = path.join(root, 'public/offline.html')
const offlinePagePath = path.join(root, 'src/app/offline/page.tsx')
const rootLayoutPath = path.join(root, 'src/app/layout.tsx')
const swJsPath = path.join(root, 'public/sw.js')
const nextConfigPath = path.join(root, 'next.config.ts')
const installBannerPath = path.join(root, 'src/components/layout/PwaInstallBanner.tsx')
const deferredBannersPath = path.join(root, 'src/components/layout/DeferredLayoutBanners.tsx')
const brandPath = path.join(root, 'src/lib/brand.ts')

const icon192 = path.join(root, 'public/android-chrome-192x192.png')
const icon512 = path.join(root, 'public/android-chrome-512x512.png')
const logoIcon = path.join(root, 'public/logo-icon.svg')
const appleTouch = path.join(root, 'public/apple-touch-icon.png')

function read(file: string): string {
  return readFileSync(file, 'utf-8')
}

function manifest() {
  return JSON.parse(read(manifestPath)) as {
    id?: string
    name?: string
    short_name?: string
    description?: string
    lang?: string
    start_url?: string
    scope?: string
    display?: string
    orientation?: string
    background_color?: string
    theme_color?: string
    categories?: string[]
    icons?: Array<{ src: string; sizes?: string; type?: string; purpose?: string }>
  }
}

test.describe('PWA — 20 integrity checks', () => {
  // ── 1–6 Manifest ──────────────────────────────────────────────────────────

  test('1. manifest.webmanifest existuje a je validný JSON', () => {
    expect(existsSync(manifestPath)).toBe(true)
    const body = manifest()
    expect(body).toBeTruthy()
    expect(typeof body.name).toBe('string')
  })

  test('2. manifest má id, scope, start_url a lang sk', () => {
    const body = manifest()
    expect(body.id).toBe('/')
    expect(body.scope).toBe('/')
    expect(body.start_url).toBe('/')
    expect(body.lang).toBe('sk')
  })

  test('3. manifest display=standalone a brand colors', () => {
    const body = manifest()
    expect(body.display).toBe('standalone')
    expect(body.orientation).toBe('portrait-primary')
    expect(body.theme_color?.toUpperCase()).toBe('#35C79A')
    expect(body.background_color?.toUpperCase()).toBe('#FFFFFF')
  })

  test('4. manifest name/short_name/description a kategórie shopping+health', () => {
    const body = manifest()
    expect(body.name).toMatch(/GrowMedica/i)
    expect(body.short_name).toMatch(/GrowMedica/i)
    expect((body.description ?? '').length).toBeGreaterThan(20)
    expect(body.categories).toEqual(expect.arrayContaining(['shopping', 'health']))
  })

  test('5. manifest ikony: any + maskable, 192 a 512', () => {
    const body = manifest()
    expect(body.icons?.length).toBeGreaterThanOrEqual(3)
    const purposes = (body.icons ?? []).map((i) => i.purpose)
    expect(purposes).toContain('any')
    expect(purposes).toContain('maskable')
    const sizes = (body.icons ?? []).map((i) => i.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  })

  test('6. súbory ikon z manifestu existujú na disku', () => {
    const body = manifest()
    for (const icon of body.icons ?? []) {
      const filePath = path.join(root, 'public', icon.src.replace(/^\//, ''))
      expect(existsSync(filePath), `missing icon ${icon.src}`).toBe(true)
    }
    expect(existsSync(icon192)).toBe(true)
    expect(existsSync(icon512)).toBe(true)
    expect(existsSync(logoIcon)).toBe(true)
    expect(existsSync(appleTouch)).toBe(true)
  })

  // ── 7–10 Offline ──────────────────────────────────────────────────────────

  test('7. /offline React page existuje s SK copy a noindex', () => {
    expect(existsSync(offlinePagePath)).toBe(true)
    const content = read(offlinePagePath)
    expect(content).toContain('Bez pripojenia')
    expect(content).toMatch(/robots:\s*\{\s*index:\s*false/)
    expect(content).toContain('href="/"')
    expect(content).toContain('href="/produkty"')
  })

  test('8. /offline.html statická záloha má DOCTYPE a theme-color', () => {
    expect(existsSync(offlineHtmlPath)).toBe(true)
    const html = read(offlineHtmlPath)
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('Bez pripojenia')
    expect(html).toContain('theme-color')
    expect(html).toMatch(/#35C79A/i)
    expect(html).toMatch(/lang=["']sk["']/)
  })

  test('9. offline fallback: static reload CTA + React page Domov/Produkty', () => {
    const html = read(offlineHtmlPath)
    expect(html).toContain('Obnoviť stránku')
    expect(html).toMatch(/location\.reload\s*\(/)

    // Full navigation CTAs live on the React /offline route
    const page = read(offlinePagePath)
    expect(page).toContain('href="/"')
    expect(page).toContain('href="/produkty"')
  })

  test('10. layout registruje manifest a apple-touch-icon', () => {
    expect(existsSync(rootLayoutPath)).toBe(true)
    const layout = read(rootLayoutPath)
    expect(layout).toContain("manifest: '/manifest.webmanifest'")
    expect(layout).toContain('apple-touch-icon')
    expect(layout).toMatch(/<html/i)
  })

  // ── 11–15 Service worker source + build ───────────────────────────────────

  test('11. sw.ts: NetworkFirst navigácia, skipWaiting, clientsClaim', () => {
    expect(existsSync(swSourcePath)).toBe(true)
    const source = read(swSourcePath)
    expect(source).toContain('navigationPreload: false')
    expect(source).toContain('skipWaiting: true')
    expect(source).toContain('clientsClaim: true')
    expect(source).toMatch(/handler: new NetworkFirst/)
    expect(source).toContain('networkTimeoutSeconds: 5')
    expect(source).toContain('cleanupOutdatedCaches: true')
  })

  test('12. sw.ts: dashboard a /api/dashboard sú NetworkOnly (bez offline shell)', () => {
    const source = read(swSourcePath)
    expect(source).toContain('isDashboardPath')
    expect(source).toMatch(/\/api\/dashboard/)
    expect(source).toMatch(/!isDashboardPath\(url\.pathname\)/)
    expect(source).toMatch(/handler: new NetworkOnly/)
    expect(source).toContain('setCatchHandler')
  })

  test('13. sw.ts: offline fallback entries + catch handler', () => {
    const source = read(swSourcePath)
    expect(source).toContain("url: '/offline.html'")
    expect(source).toContain("url: '/offline'")
    expect(source).toContain("matchPrecache('/offline.html')")
    expect(source).toContain("matchPrecache('/offline')")
    expect(source).toContain('serwist.addEventListeners()')
  })

  test('14. sw.js je dostupný po production build a bez navigationPreload', () => {
    expect(existsSync(swJsPath)).toBe(true)
    const content = read(swJsPath)
    expect(content.length).toBeGreaterThan(1000)
    expect(content).not.toContain('navigationPreload:!0')
    expect(content).toContain('/dashboard')
    expect(content).toMatch(/offline/)
  })

  test('15. next.config Serwist: swSrc/swDest + precache offline/manifest', () => {
    expect(existsSync(nextConfigPath)).toBe(true)
    const config = read(nextConfigPath)
    expect(config).toContain("swSrc: 'src/app/sw.ts'")
    expect(config).toContain("swDest: 'public/sw.js'")
    expect(config).toContain("url: '/offline'")
    expect(config).toContain("url: '/offline.html'")
    expect(config).toContain("url: '/manifest.webmanifest'")
    expect(config).toContain("disable: process.env.NODE_ENV === 'development'")
  })

  // ── 16–17 Install banner ──────────────────────────────────────────────────

  test('16. PwaInstallBanner: beforeinstallprompt + dismiss localStorage', () => {
    expect(existsSync(installBannerPath)).toBe(true)
    const src = read(installBannerPath)
    expect(src).toContain('beforeinstallprompt')
    expect(src).toContain('growmedica-pwa-dismissed')
    expect(src).toContain('Inštalovať')
    expect(src).toContain('Neskôr')
    expect(src).toContain('aria-label="Inštalácia aplikácie"')
  })

  test('17. DeferredLayoutBanners lazy-loaduje PwaInstallBanner', () => {
    expect(existsSync(deferredBannersPath)).toBe(true)
    const src = read(deferredBannersPath)
    expect(src).toContain('PwaInstallBanner')
    expect(src).toMatch(/dynamic\(\s*\(\)\s*=>\s*import\(/)
  })

  // ── 18–20 Runtime HTTP (production server via yarn test:pwa) ──────────────

  test('18. GET /manifest.webmanifest vracia JSON s theme_color', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest')
    expect(res.ok()).toBe(true)
    const ct = res.headers()['content-type'] ?? ''
    expect(ct).toMatch(/json|manifest/i)
    const body = await res.json()
    expect(body.theme_color?.toUpperCase()).toBe('#35C79A')
    expect(body.display).toBe('standalone')
  })

  test('19. GET /offline a /offline.html sú 200 s offline copy', async ({ request }) => {
    const route = await request.get('/offline')
    expect(route.ok()).toBe(true)
    const routeHtml = await route.text()
    expect(routeHtml).toContain('Bez pripojenia')

    const staticFile = await request.get('/offline.html')
    expect(staticFile.ok()).toBe(true)
    const staticHtml = await staticFile.text()
    expect(staticHtml).toContain('Bez pripojenia')
    expect(staticHtml.startsWith('<!DOCTYPE html>')).toBe(true)
  })

  test('20. GET /sw.js + homepage linkuje manifest; brand allowlist obsahuje manifest', async ({
    request,
  }) => {
    const sw = await request.get('/sw.js')
    expect(sw.ok()).toBe(true)
    const swCt = sw.headers()['content-type'] ?? ''
    expect(swCt).toMatch(/javascript|ecmascript/i)
    const swBody = await sw.text()
    expect(swBody.length).toBeGreaterThan(500)

    const home = await request.get('/')
    expect(home.ok()).toBe(true)
    const html = await home.text()
    expect(html).toMatch(/manifest\.webmanifest/)

    expect(existsSync(brandPath)).toBe(true)
    expect(read(brandPath)).toContain('/manifest.webmanifest')
  })
})
