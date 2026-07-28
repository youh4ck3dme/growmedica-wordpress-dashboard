/**
 * Storefront cookie consent — decision cookie for GDPR-style banner.
 * Third-party scripts can later gate on `readConsent()` / `growmedica:consent`.
 */

export const CONSENT_COOKIE_NAME = 'growmedica_consent'
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
export const CONSENT_VERSION = 1
export const CONSENT_EVENT = 'growmedica:consent'

export type CookieConsent = {
  version: number
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

export type ConsentEventDetail = {
  consent: CookieConsent | null
  visible: boolean
}

export function createConsent(partial: {
  analytics: boolean
  marketing: boolean
}): CookieConsent {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    updatedAt: new Date().toISOString(),
  }
}

export function acceptAllConsent(): CookieConsent {
  return createConsent({ analytics: true, marketing: true })
}

export function necessaryOnlyConsent(): CookieConsent {
  return createConsent({ analytics: false, marketing: false })
}

/** Parse cookie payload; returns null if missing/invalid/outdated version. */
export function parseConsentValue(raw: string | null | undefined): CookieConsent | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    const data = JSON.parse(decoded) as Partial<CookieConsent>
    if (data.version !== CONSENT_VERSION) return null
    if (data.necessary !== true) return null
    if (typeof data.analytics !== 'boolean') return null
    if (typeof data.marketing !== 'boolean') return null
    if (typeof data.updatedAt !== 'string' || !data.updatedAt) return null
    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: data.analytics,
      marketing: data.marketing,
      updatedAt: data.updatedAt,
    }
  } catch {
    return null
  }
}

export function serializeConsent(consent: CookieConsent): string {
  return encodeURIComponent(JSON.stringify(consent))
}

export function hasConsentDecision(consent: CookieConsent | null): boolean {
  return consent !== null
}

function readRawCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? match[1] : null
}

export function readConsent(): CookieConsent | null {
  return parseConsentValue(readRawCookie(CONSENT_COOKIE_NAME))
}

export function writeConsent(consent: CookieConsent): void {
  if (typeof document === 'undefined') return
  const value = serializeConsent(consent)
  document.cookie = `${CONSENT_COOKIE_NAME}=${value};path=/;max-age=${CONSENT_COOKIE_MAX_AGE};SameSite=Lax`
  dispatchConsentEvent({ consent, visible: false })
}

export function dispatchConsentEvent(detail: ConsentEventDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<ConsentEventDetail>(CONSENT_EVENT, { detail }))
}
