/**
 * Woo titles may arrive pre-escaped (`Focus &amp; mozog`); React would show `&amp;amp;`.
 * Mirrors storefront/src/lib/utils.ts decodeHtmlEntities + adapter title mapping.
 * Run: yarn test:unit
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function decodeHtmlEntities(text) {
  if (!text || !text.includes('&')) return text
  let value = text
  for (let pass = 0; pass < 3; pass++) {
    const next = value
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#(\d+);/g, (_, code) => {
        const n = Number(code)
        return Number.isFinite(n) ? String.fromCodePoint(n) : _
      })
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        const n = parseInt(hex, 16)
        return Number.isFinite(n) ? String.fromCodePoint(n) : _
      })
    if (next === value) break
    value = next
  }
  return value
}

describe('decodeHtmlEntities (Woo titles)', () => {
  it('decodes single-encoded ampersand', () => {
    assert.equal(decodeHtmlEntities('Focus &amp; mozog'), 'Focus & mozog')
  })

  it('decodes double-encoded ampersand', () => {
    assert.equal(decodeHtmlEntities('Focus &amp;amp; mozog'), 'Focus & mozog')
  })

  it('leaves plain ampersand unchanged', () => {
    assert.equal(decodeHtmlEntities('Focus & mozog'), 'Focus & mozog')
  })
})

describe('adapter title decode contract', () => {
  it('adapter.ts decodes product.name before title / seo.title', () => {
    const src = readFileSync(
      resolve(import.meta.dirname, '../../src/lib/wordpress/adapter.ts'),
      'utf8',
    )
    assert.match(src, /decodeHtmlEntities/)
    assert.match(src, /const title = decodeHtmlEntities\(product\.name\)/)
    assert.match(src, /title: listItem\.title/)
  })

  it('collections.ts decodes category.name', () => {
    const src = readFileSync(
      resolve(import.meta.dirname, '../../src/lib/catalog/collections.ts'),
      'utf8',
    )
    assert.match(src, /decodeHtmlEntities\(category\.name\)/)
  })
})
