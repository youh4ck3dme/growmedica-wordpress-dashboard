const DEFAULT_SITE_URL = 'https://growmedica.cz'

/** Safe public site URL — empty or invalid NEXT_PUBLIC_SITE_URL falls back to production default. */
export function resolvePublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return DEFAULT_SITE_URL

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return DEFAULT_SITE_URL
    }
    return raw.replace(/\/$/, '') || DEFAULT_SITE_URL
  } catch {
    return DEFAULT_SITE_URL
  }
}
