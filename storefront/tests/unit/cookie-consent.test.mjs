import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CONSENT_VERSION,
  acceptAllConsent,
  createConsent,
  hasConsentDecision,
  necessaryOnlyConsent,
  parseConsentValue,
  serializeConsent,
} from '../../src/lib/cookie-consent.ts'

describe('createConsent helpers', () => {
  it('acceptAll enables analytics and marketing', () => {
    const c = acceptAllConsent()
    assert.equal(c.version, CONSENT_VERSION)
    assert.equal(c.necessary, true)
    assert.equal(c.analytics, true)
    assert.equal(c.marketing, true)
    assert.ok(c.updatedAt)
  })

  it('necessaryOnly disables optional categories', () => {
    const c = necessaryOnlyConsent()
    assert.equal(c.analytics, false)
    assert.equal(c.marketing, false)
  })

  it('createConsent keeps necessary true', () => {
    const c = createConsent({ analytics: true, marketing: false })
    assert.equal(c.necessary, true)
    assert.equal(c.analytics, true)
    assert.equal(c.marketing, false)
  })
})

describe('parseConsentValue / serializeConsent', () => {
  it('round-trips a valid consent payload', () => {
    const original = createConsent({ analytics: true, marketing: false })
    const parsed = parseConsentValue(serializeConsent(original))
    assert.deepEqual(parsed, original)
  })

  it('returns null for empty input', () => {
    assert.equal(parseConsentValue(null), null)
    assert.equal(parseConsentValue(''), null)
    assert.equal(parseConsentValue(undefined), null)
  })

  it('rejects wrong version or shape', () => {
    const badVersion = encodeURIComponent(
      JSON.stringify({
        version: 0,
        necessary: true,
        analytics: false,
        marketing: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    )
    assert.equal(parseConsentValue(badVersion), null)

    const missing = encodeURIComponent(
      JSON.stringify({ version: CONSENT_VERSION, necessary: true, analytics: false }),
    )
    assert.equal(parseConsentValue(missing), null)
  })

  it('hasConsentDecision mirrors null check', () => {
    assert.equal(hasConsentDecision(null), false)
    assert.equal(hasConsentDecision(necessaryOnlyConsent()), true)
  })
})
