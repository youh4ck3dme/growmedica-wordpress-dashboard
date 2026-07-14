export type DashboardMode = 'agentic' | 'iframe' | 'hybrid'

/** Lovable Nexus admin — iframe src pre /dashboard (produkcia + lokál). */
export const NEXUS_DASHBOARD_IFRAME_URL = 'https://growmedica-nexus.lovable.app/admin'

/** Priamy login odkaz (nový tab). */
export const LEGACY_NEXUS_ADMIN_URL = 'https://growmedica-nexus.lovable.app/admin/prihlasenie'

/** agentic | iframe | hybrid (default: hybrid = AI Agent + Lovable Nexus) */
export function getDashboardMode(): DashboardMode {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_MODE?.trim().toLowerCase()
  if (raw === 'agentic' || raw === 'iframe' || raw === 'hybrid') return raw
  return 'hybrid'
}

function isLocalDashboardHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
}

/** Public iframe target (Lovable Nexus alebo custom URL z env). */
export function getDashboardUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim() || NEXUS_DASHBOARD_IFRAME_URL

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined
    if (process.env.NODE_ENV === 'production' && isLocalDashboardHost(parsed.hostname)) {
      return NEXUS_DASHBOARD_IFRAME_URL
    }
    return parsed.toString()
  } catch {
    return undefined
  }
}

/** Origin extracted from NEXT_PUBLIC_DASHBOARD_URL for CSP frame-src. */
export function getDashboardOrigin(): string | undefined {
  const url = getDashboardUrl()
  if (!url) return undefined

  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

export const DASHBOARD_ROUTE_HEADER = 'x-dashboard-route'

export function isDashboardRouteHeader(value: string | null): boolean {
  return value === '1'
}