import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { getSeoTaxonomyRedirects } from '@/lib/seo-taxonomy-redirects'
import { getIndexableSeoTaxonomyPaths } from '@/lib/seo-taxonomy'

const freezePath = path.join(process.cwd(), '..', 'reports', 'seo-taxonomy', 'FREEZE.json')
const taxonomyPath = path.join(process.cwd(), '..', 'reports', 'seo-taxonomy', 'growmedica-seo-menu-tree.json')

test.describe('SEO taxonomy redirects & freeze', () => {
  test('freeze manifest matches taxonomy sha256', () => {
    expect(existsSync(freezePath)).toBe(true)
    expect(existsSync(taxonomyPath)).toBe(true)
    const freeze = JSON.parse(readFileSync(freezePath, 'utf-8'))
    const { createHash } = require('node:crypto') as typeof import('node:crypto')
    const actual = createHash('sha256').update(readFileSync(taxonomyPath)).digest('hex')
    expect(actual).toBe(freeze.sha256['growmedica-seo-menu-tree.json'])
    expect(freeze.counts.ready).toBe(459)
    expect(freeze.counts.hold).toBe(1)
  })

  test('redirect table is path-only, unique sources, no loops', () => {
    const rows = getSeoTaxonomyRedirects()
    expect(rows.length).toBeGreaterThan(400)
    const sources = new Set<string>()
    for (const row of rows) {
      expect(row.source.startsWith('/')).toBe(true)
      expect(row.destination.startsWith('/')).toBe(true)
      expect(row.source).not.toMatch(/^https?:/)
      expect(row.destination).not.toMatch(/^https?:/)
      expect(row.source).not.toBe(row.destination)
      expect(sources.has(row.source)).toBe(false)
      sources.add(row.source)
      expect(row.permanent).toBe(true)
    }
  })

  test('HOLD product is not a redirect destination', () => {
    const taxonomy = JSON.parse(readFileSync(taxonomyPath, 'utf-8'))
    const hold = (taxonomy.wooImportProducts as { handle: string; importStatus: string }[])
      .filter((row) => row.importStatus === 'HOLD')
      .map((row) => row.handle)
    expect(hold).toContain('bio-polyporus-prasok-100g-odvodhuje-organizmus')

    const rows = getSeoTaxonomyRedirects()
    for (const h of hold) {
      const hits = rows.filter((r) => r.destination === `/produkty/${h}` || r.destination.endsWith(`/produkty/${h}`))
      expect(hits, `HOLD handle should not be redirect target: ${h}`).toHaveLength(0)
    }
  })

  test('product destinations use /produkty; category destinations use /kategorie', () => {
    const rows = getSeoTaxonomyRedirects()
    const productish = rows.filter((r) => r.destination.startsWith('/produkty/'))
    const categoryish = rows.filter((r) => r.destination.startsWith('/kategorie/'))
    expect(productish.length).toBeGreaterThan(400)
    expect(categoryish.length).toBeGreaterThan(100)
    // locale prefix stripped from destinations
    expect(rows.every((r) => !r.destination.startsWith('/sk/'))).toBe(true)
  })

  test('indexable taxonomy paths are non-empty strings', () => {
    const paths = getIndexableSeoTaxonomyPaths()
    expect(paths.length).toBeGreaterThan(0)
    expect(paths.every((p) => typeof p === 'string' && p.length > 0)).toBe(true)
  })
})
