import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import robots from '../../src/app/robots'
import {
  DEFAULT_METADATA,
  isSiteNoindexEnabled,
  resolvePageRobots,
  withSiteRobots,
} from '../../src/lib/seo'

function withEnv(key: string, value: string | undefined, fn: () => void) {
  const prev = process.env[key]
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
  try {
    fn()
  } finally {
    if (prev === undefined) delete process.env[key]
    else process.env[key] = prev
  }
}

test.describe('Site-wide soft-launch noindex', () => {
  test('default (unset) is noindex ON', () => {
    withEnv('SITE_NOINDEX', undefined, () => {
      withEnv('NEXT_PUBLIC_SITE_NOINDEX', undefined, () => {
        expect(isSiteNoindexEnabled()).toBe(true)
        expect(resolvePageRobots(true)).toMatchObject({ index: false, follow: false })
      })
    })
  })

  test('SITE_NOINDEX=0 re-enables indexing', () => {
    withEnv('SITE_NOINDEX', '0', () => {
      expect(isSiteNoindexEnabled()).toBe(false)
      expect(resolvePageRobots(true)).toMatchObject({ index: true, follow: true })
      expect(resolvePageRobots(false)).toMatchObject({ index: false, follow: false })
    })
  })

  test('robots.txt disallows entire site when noindex ON', () => {
    withEnv('SITE_NOINDEX', '1', () => {
      const config = robots()
      const rules = config.rules
      const baseRule = Array.isArray(rules) ? rules[0] : rules
      expect(baseRule?.disallow).toBe('/')
      expect(config.sitemap).toBeUndefined()
    })
  })

  test('withSiteRobots forces noindex on page metadata', () => {
    withEnv('SITE_NOINDEX', '1', () => {
      const meta = withSiteRobots({ title: 'Test', robots: { index: true, follow: true } })
      expect(meta.robots).toMatchObject({ index: false, follow: false })
    })
  })

  test('DEFAULT_METADATA and helpers wire resolvePageRobots / withSiteRobots', () => {
    const seoPath = path.join(process.cwd(), 'src/lib/seo.ts')
    const content = fs.readFileSync(seoPath, 'utf8')
    expect(content).toContain('isSiteNoindexEnabled')
    expect(content).toContain('resolvePageRobots')
    expect(content).toContain('withSiteRobots')
    expect(content).toContain('robots: resolvePageRobots(true)')
    // Sanity: module exports usable robots field
    expect(DEFAULT_METADATA.robots).toBeTruthy()
  })

  test('kategorie page uses resolvePageRobots (global noindex wins)', () => {
    const pagePath = path.join(process.cwd(), 'src/app/kategorie/[...path]/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf8')
    expect(content).toContain('resolvePageRobots')
    expect(content).not.toMatch(/robots:\s*\{\s*index:\s*shouldIndex/)
  })

  test('sitemap returns empty list when noindex ON (source wiring)', () => {
    const sitemapPath = path.join(process.cwd(), 'src/app/sitemap.ts')
    const content = fs.readFileSync(sitemapPath, 'utf8')
    expect(content).toContain('isSiteNoindexEnabled')
    expect(content).toContain('return []')
  })

  test('middleware and next.config set X-Robots-Tag when noindex ON', () => {
    const mw = fs.readFileSync(path.join(process.cwd(), 'src/middleware.ts'), 'utf8')
    expect(mw).toContain('X-Robots-Tag')
    expect(mw).toContain('noindex')
    const cfg = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8')
    expect(cfg).toContain('X-Robots-Tag')
    expect(cfg).toContain('SITE_NOINDEX')
  })
})
