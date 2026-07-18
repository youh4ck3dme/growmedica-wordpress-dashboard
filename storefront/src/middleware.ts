import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DASHBOARD_ROUTE_HEADER } from '@/lib/dashboard'
import { PATHNAME_HEADER } from '@/lib/request-headers'
import {
  isValidLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  resolveLocaleFromInput,
} from '@/lib/i18n'

function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

/** Edge-safe mirror of isSiteNoindexEnabled() — keep logic in sync with src/lib/seo.ts */
function isSiteNoindexEnabled(): boolean {
  const raw =
    process.env.SITE_NOINDEX?.trim() ||
    process.env.NEXT_PUBLIC_SITE_NOINDEX?.trim() ||
    ''
  if (!raw) return true
  const v = raw.toLowerCase()
  if (['0', 'false', 'no', 'off'].includes(v)) return false
  return true
}

function applyNoindexHeader(response: NextResponse): NextResponse {
  if (isSiteNoindexEnabled()) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noimageindex')
  }
  return response
}

const HOLD_PRODUCT_LEGACY_PATH =
  '/sk/hlavna-stranka/zdravie/produkt/bio-polyporus-prasok-100g-odvodnuje-organizmus/190'
const HOLD_PRODUCT_TARGET_PATH = '/produkty/bio-polyporus-prasok-100g-odvodhuje-organizmus'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Next custom routes omit this single frozen HOLD redirect from the build manifest.
  // Preserve the legacy URL without importing or modifying the HOLD product in Woo.
  if (pathname === HOLD_PRODUCT_LEGACY_PATH) {
    return applyNoindexHeader(
      NextResponse.redirect(new URL(HOLD_PRODUCT_TARGET_PATH, request.url), 301),
    )
  }

  if (isDashboardPath(pathname)) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value ?? null
    const resolved = resolveLocaleFromInput({
      cookieLocale,
      country: request.headers.get('x-vercel-ip-country'),
      acceptLanguage: request.headers.get('accept-language'),
    })
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(DASHBOARD_ROUTE_HEADER, '1')
    requestHeaders.set(LOCALE_HEADER, resolved)
    requestHeaders.set(PATHNAME_HEADER, pathname)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (!cookieLocale) {
      response.cookies.set(LOCALE_COOKIE, resolved, {
        path: '/',
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: 'lax',
      })
    }
    return applyNoindexHeader(response)
  }

  const queryLang = searchParams.get('lang')
  if (queryLang && isValidLocale(queryLang)) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('lang')
    const response = NextResponse.redirect(url)
    response.cookies.set(LOCALE_COOKIE, queryLang, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
    return applyNoindexHeader(response)
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value ?? null
  const resolved = resolveLocaleFromInput({
    cookieLocale,
    country: request.headers.get('x-vercel-ip-country'),
    acceptLanguage: request.headers.get('accept-language'),
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_HEADER, resolved)
  requestHeaders.set(PATHNAME_HEADER, pathname)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  if (!cookieLocale) {
    response.cookies.set(LOCALE_COOKIE, resolved, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
  }

  return applyNoindexHeader(response)
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
