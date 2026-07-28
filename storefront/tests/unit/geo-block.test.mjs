import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  evaluateGeoBlock,
  getBlockedCountries,
  getTrustedCountryCode,
  isGeoBlockEnabled,
} from '../../src/lib/geo-block.ts'

function headers(map = {}) {
  return new Headers(map)
}

describe('isGeoBlockEnabled', () => {
  it('is off by default', () => {
    assert.equal(isGeoBlockEnabled({}), false)
    assert.equal(isGeoBlockEnabled({ GEO_BLOCK_ENABLED: '' }), false)
    assert.equal(isGeoBlockEnabled({ GEO_BLOCK_ENABLED: '0' }), false)
    assert.equal(isGeoBlockEnabled({ GEO_BLOCK_ENABLED: 'false' }), false)
  })

  it('accepts truthy flags', () => {
    assert.equal(isGeoBlockEnabled({ GEO_BLOCK_ENABLED: '1' }), true)
    assert.equal(isGeoBlockEnabled({ GEO_BLOCK_ENABLED: 'true' }), true)
    assert.equal(isGeoBlockEnabled({ GEO_BLOCK_ENABLED: 'ON' }), true)
  })
})

describe('getBlockedCountries', () => {
  it('defaults to SG', () => {
    assert.deepEqual([...getBlockedCountries({})].sort(), ['SG'])
  })

  it('parses comma-separated ISO codes', () => {
    const set = getBlockedCountries({ GEO_BLOCK_COUNTRIES: 'sg, cn, XX' })
    assert.equal(set.has('SG'), true)
    assert.equal(set.has('CN'), true)
    assert.equal(set.has('XX'), true)
  })
})

describe('getTrustedCountryCode', () => {
  it('prefers x-vercel-ip-country', () => {
    const h = headers({
      'x-vercel-ip-country': 'sg',
      'cf-ipcountry': 'SK',
    })
    assert.equal(getTrustedCountryCode(h), 'SG')
  })

  it('falls back to cf-ipcountry', () => {
    const h = headers({ 'cf-ipcountry': 'sg' })
    assert.equal(getTrustedCountryCode(h), 'SG')
  })

  it('ignores CF unknown/tor markers', () => {
    assert.equal(getTrustedCountryCode(headers({ 'cf-ipcountry': 'XX' })), null)
    assert.equal(getTrustedCountryCode(headers({ 'cf-ipcountry': 'T1' })), null)
  })
})

describe('evaluateGeoBlock', () => {
  it('allows when disabled even if country is SG', () => {
    const decision = evaluateGeoBlock(
      { headers: headers({ 'x-vercel-ip-country': 'SG' }), pathname: '/' },
      { GEO_BLOCK_ENABLED: '0' },
    )
    assert.equal(decision.blocked, false)
  })

  it('blocks SG when enabled', () => {
    const decision = evaluateGeoBlock(
      {
        headers: headers({
          'x-vercel-ip-country': 'SG',
          'x-vercel-forwarded-for': '203.0.113.10',
          'user-agent': 'geo-block-test',
        }),
        pathname: '/api/cart',
      },
      { GEO_BLOCK_ENABLED: '1' },
    )
    assert.equal(decision.blocked, true)
    if (decision.blocked) {
      assert.equal(decision.country, 'SG')
      assert.equal(decision.ip, '203.0.113.10')
      assert.equal(decision.path, '/api/cart')
      assert.equal(decision.userAgent, 'geo-block-test')
    }
  })

  it('allows SK when enabled', () => {
    const decision = evaluateGeoBlock(
      { headers: headers({ 'x-vercel-ip-country': 'SK' }), pathname: '/' },
      { GEO_BLOCK_ENABLED: '1', GEO_BLOCK_COUNTRIES: 'SG' },
    )
    assert.equal(decision.blocked, false)
  })

  it('allows when country header missing (no spoof via x-forwarded-for alone)', () => {
    const decision = evaluateGeoBlock(
      { headers: headers({ 'x-forwarded-for': '8.8.8.8' }), pathname: '/' },
      { GEO_BLOCK_ENABLED: '1' },
    )
    assert.equal(decision.blocked, false)
  })
})
