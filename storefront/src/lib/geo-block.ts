/**
 * Country-based request blocking (GeoIP via platform headers).
 *
 * On Vercel, `x-vercel-ip-country` is set from the connecting client IP and
 * cannot be spoofed by the browser. Do not trust client-supplied country
 * headers or raw X-Forwarded-For for the block decision.
 *
 * Env:
 * - GEO_BLOCK_ENABLED=1|true|on  — master switch (default: off)
 * - GEO_BLOCK_COUNTRIES=SG,XX     — ISO 3166-1 alpha-2, comma-separated
 *                                   (default when enabled: SG)
 *
 * Edge-safe pure helpers (no next/server import) so unit tests run under node:test.
 */

const DEFAULT_BLOCKED_COUNTRIES = ['SG'] as const

function truthyEnv(value: string | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

/** Master switch — off unless explicitly enabled. */
export function isGeoBlockEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return truthyEnv(env.GEO_BLOCK_ENABLED)
}

/**
 * ISO country codes to block (uppercase).
 * When GEO_BLOCK_ENABLED is on and GEO_BLOCK_COUNTRIES is empty → SG.
 */
export function getBlockedCountries(
  env: NodeJS.ProcessEnv = process.env,
): Set<string> {
  const raw = env.GEO_BLOCK_COUNTRIES?.trim()
  if (!raw) {
    return new Set(DEFAULT_BLOCKED_COUNTRIES)
  }
  const codes = raw
    .split(/[,\s]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c))
  return new Set(codes.length > 0 ? codes : DEFAULT_BLOCKED_COUNTRIES)
}

/**
 * Trusted platform country only.
 * Prefer Vercel; fall back to Cloudflare if present.
 * Never use X-Forwarded-For or client-forged geo headers for decisions.
 */
export function getTrustedCountryCode(
  headers: Headers | { get(name: string): string | null },
): string | null {
  const vercel = headers.get('x-vercel-ip-country')?.trim().toUpperCase()
  if (vercel && /^[A-Z]{2}$/.test(vercel)) return vercel

  const cf = headers.get('cf-ipcountry')?.trim().toUpperCase()
  // CF uses XX for unknown; T1 for tor — skip non-country values
  if (cf && /^[A-Z]{2}$/.test(cf) && cf !== 'XX' && cf !== 'T1') return cf

  return null
}

/** Client IP for logging only (not used for geo decision). */
export function getClientIpForLog(
  headers: Headers | { get(name: string): string | null },
  fallbackIp?: string | null,
): string {
  const vercelFf = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
  if (vercelFf) return vercelFf

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const xff = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (xff) return xff

  return fallbackIp?.trim() || 'unknown'
}

export type GeoBlockInput = {
  headers: Headers | { get(name: string): string | null }
  pathname: string
  /** Optional runtime IP (e.g. NextRequest.ip) — logging only */
  ip?: string | null
}

export type GeoBlockDecision =
  | { blocked: false }
  | {
      blocked: true
      country: string
      ip: string
      path: string
      userAgent: string
    }

export function evaluateGeoBlock(
  input: GeoBlockInput,
  env: NodeJS.ProcessEnv = process.env,
): GeoBlockDecision {
  if (!isGeoBlockEnabled(env)) {
    return { blocked: false }
  }

  const country = getTrustedCountryCode(input.headers)
  if (!country) {
    return { blocked: false }
  }

  const blocked = getBlockedCountries(env)
  if (!blocked.has(country)) {
    return { blocked: false }
  }

  return {
    blocked: true,
    country,
    ip: getClientIpForLog(input.headers, input.ip),
    path: input.pathname,
    userAgent: input.headers.get('user-agent')?.slice(0, 300) || 'unknown',
  }
}

export function logGeoBlock(
  decision: Extract<GeoBlockDecision, { blocked: true }>,
): void {
  // Structured one-liner for Vercel / platform log drains
  console.warn(
    JSON.stringify({
      level: 'warn',
      event: 'geo_block',
      timestamp: new Date().toISOString(),
      ip: decision.ip,
      country: decision.country,
      path: decision.path,
      userAgent: decision.userAgent,
    }),
  )
}

/** Headers for a minimal 403 response (no sensitive details in body). */
export const GEO_BLOCK_RESPONSE_INIT = {
  status: 403,
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  },
} as const

export const GEO_BLOCK_BODY = 'Forbidden'
