import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const swSourcePath = path.join(process.cwd(), 'src/app/sw.ts')
const manifestPath = path.join(process.cwd(), 'public/manifest.webmanifest')
const offlineHtmlPath = path.join(process.cwd(), 'public/offline.html')
const offlinePagePath = path.join(process.cwd(), 'src/app/offline/page.tsx')
const rootLayoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
const swJsPath = path.join(process.cwd(), 'public/sw.js')

test.describe('PWA — manifest & offline', () => {
  test('manifest.webmanifest obsahuje id, scope a kategórie', () => {
    expect(existsSync(manifestPath)).toBe(true)
    const body = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    expect(body.id).toBe('/')
    expect(body.scope).toBe('/')
    expect(body.lang).toBe('sk')
    expect(body.theme_color?.toUpperCase()).toBe('#35C79A')
    expect(body.categories).toContain('shopping')
    expect(body.icons?.length).toBeGreaterThanOrEqual(3)
  })

  test('manifest má oddelené purpose any a maskable ikony', () => {
    expect(existsSync(manifestPath)).toBe(true)
    const body = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    const purposes = (body.icons as { purpose?: string }[]).map((icon) => icon.purpose)
    expect(purposes).toContain('any')
    expect(purposes).toContain('maskable')
  })

  test('/offline route je dostupná', () => {
    expect(existsSync(offlinePagePath)).toBe(true)
    const content = readFileSync(offlinePagePath, 'utf-8')
    expect(content).toContain('Bez pripojenia')
  })

  test('/offline.html statická záloha je dostupná', () => {
    expect(existsSync(offlineHtmlPath)).toBe(true)
    const html = readFileSync(offlineHtmlPath, 'utf-8')
    expect(html).toContain('Bez pripojenia')
  })

  test('HTML dokumenty majú DOCTYPE (žiadny Quirks Mode)', () => {
    // Verify static backup
    expect(existsSync(offlineHtmlPath)).toBe(true)
    const html = readFileSync(offlineHtmlPath, 'utf-8')
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html.charCodeAt(0)).toBe(60) // '<'

    // Verify next layout which ensures DOCTYPE for dynamic routes (/, /kosik, /offline)
    expect(existsSync(rootLayoutPath)).toBe(true)
    const layout = readFileSync(rootLayoutPath, 'utf-8')
    expect(layout).toMatch(/<html/i)
  })

  test('sw.js je dostupný po production build', () => {
    expect(existsSync(swJsPath)).toBe(true)
  })

  test('sw.ts používa NetworkFirst pre navigáciu a vypnutý navigationPreload', () => {
    expect(existsSync(swSourcePath)).toBe(true)
    const source = readFileSync(swSourcePath, 'utf-8')
    expect(source).toContain('navigationPreload: false')
    expect(source).toMatch(
      /matcher: \(\{ request, sameOrigin \}\) => sameOrigin && request\.mode === 'navigate',\s*handler: new NetworkFirst/,
    )
    expect(source).toContain("url: '/offline.html'")
    expect(source).toContain('setCatchHandler')
  })

  test('sw.js build nemá navigationPreload a navigate používa NetworkFirst', () => {
    expect(existsSync(swJsPath)).toBe(true)
    const content = readFileSync(swJsPath, 'utf-8')
    expect(content).not.toContain('navigationPreload:!0')
    expect(content).toMatch(/"navigate"===\w\.mode\}?,handler:new \w+/)
  })
})
