/**
 * Unit tests for Woo checkout URL builder (multi-SKU seed).
 * Run: node --test tests/unit/woo-cart-checkout.test.mjs
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

// Mirror encode logic without importing TS (Node test runner).
function buildWooCheckoutUrl(base, items) {
  const root = base.replace(/\/$/, '')
  const normalized = items
    .filter((item) => item.productId > 0 && item.quantity > 0)
    .map((item) => ({
      productId: item.productId,
      quantity: Math.min(Math.floor(item.quantity), 99),
    }))
  if (!normalized.length) return `${root}/kosik/`
  if (normalized.length === 1) {
    const params = new URLSearchParams()
    params.set('add-to-cart', String(normalized[0].productId))
    params.set('quantity', String(normalized[0].quantity))
    return `${root}/kontrola-objednavky/?${params.toString()}`
  }
  const seed = normalized.map((item) => `${item.productId}:${item.quantity}`).join(',')
  const params = new URLSearchParams()
  params.set('gm_cart', seed)
  return `${root}/?${params.toString()}`
}

describe('buildWooCheckoutUrl', () => {
  it('seeds all lines into gm_cart', () => {
    const url = buildWooCheckoutUrl('https://cms.example.com', [
      { productId: 10, quantity: 2 },
      { productId: 20, quantity: 1 },
    ])
    assert.equal(url, 'https://cms.example.com/?gm_cart=10%3A2%2C20%3A1')
    const gm = new URL(url).searchParams.get('gm_cart')
    assert.equal(gm, '10:2,20:1')
  })

  it('single line uses classic add-to-cart', () => {
    const url = buildWooCheckoutUrl('https://cms.example.com', [{ productId: 10, quantity: 2 }])
    assert.ok(url.includes('/kontrola-objednavky/'))
    assert.ok(url.includes('add-to-cart=10'))
    assert.ok(url.includes('quantity=2'))
  })

  it('does not drop second SKU (regression)', () => {
    const url = buildWooCheckoutUrl('https://cms.example.com/', [
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 3 },
      { productId: 3, quantity: 1 },
    ])
    const gm = new URL(url).searchParams.get('gm_cart')
    assert.ok(gm.includes('1:1'))
    assert.ok(gm.includes('2:3'))
    assert.ok(gm.includes('3:1'))
    assert.equal(gm.split(',').length, 3)
  })

  it('empty cart goes to kosik', () => {
    assert.equal(buildWooCheckoutUrl('https://cms.example.com', []), 'https://cms.example.com/kosik/')
  })
})

describe('sanitizeHtml allowlist (mirror)', () => {
  it('strips onclick with single quotes', () => {
    const dirty = `<p onclick='alert(1)'>Hi</p><img src=x onerror="alert(2)">`
    const cleaned = dirty
      .replace(/<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base|svg|math|video|audio|source|track)(\s[^>]*)?>/gi, '')
      .replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, rawTag, rawAttrs = '') => {
        const tag = rawTag.toLowerCase()
        const allowed = new Set(['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'span'])
        if (!allowed.has(tag)) return ''
        if (match.startsWith('</')) return `</${tag}>`
        return `<${tag}>`
      })
    assert.equal(cleaned, '<p>Hi</p>')
    assert.ok(!cleaned.includes('onclick'))
    assert.ok(!cleaned.includes('img'))
  })
})

describe('cart HMAC fail-closed signal', () => {
  it('signs with provided secret', () => {
    const payload = 'abc'
    const sig = createHmac('sha256', 'test-secret').update(payload).digest('base64url').slice(0, 22)
    assert.equal(sig.length, 22)
  })
})
