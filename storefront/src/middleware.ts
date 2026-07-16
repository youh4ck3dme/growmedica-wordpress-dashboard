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

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

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
    return response
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
    return response
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

  return response
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
