export type DashboardMode = 'agentic' | 'iframe' | 'hybrid'

/** Sales CRM (products UI) — preferred /dashboard iframe target. */
export const SALES_CRM_DASHBOARD_URL =
  'https://sales-crm-design-h4ck3d.vercel.app/products'

/** WordPress / WooCommerce admin (produkčný CMS). */
export const WORDPRESS_ADMIN_URL = 'https://cms.growmedica.cz/wp-admin'

/** @deprecated Prefer SALES_CRM_DASHBOARD_URL for iframe mode. */
export const NEXUS_DASHBOARD_IFRAME_URL = SALES_CRM_DASHBOARD_URL

/** Priamy odkaz do WordPress adminu (nový tab). */
export const LEGACY_NEXUS_ADMIN_URL = WORDPRESS_ADMIN_URL

/** agentic | iframe | hybrid (default: iframe = Sales CRM products embed) */
export function getDashboardMode(): DashboardMode {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_MODE?.trim().toLowerCase()
  if (raw === 'agentic' || raw === 'iframe' || raw === 'hybrid') return raw
  return 'iframe'
}

function isLocalDashboardHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
}

/** Public iframe target (Sales CRM products, or custom URL z env). */
export function getDashboardUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim() || SALES_CRM_DASHBOARD_URL

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined
    if (process.env.NODE_ENV === 'production' && isLocalDashboardHost(parsed.hostname)) {
      return SALES_CRM_DASHBOARD_URL
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