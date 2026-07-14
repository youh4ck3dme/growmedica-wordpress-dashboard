import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DASHBOARD_ROUTE_HEADER } from '@/lib/dashboard'

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(DASHBOARD_ROUTE_HEADER, '1')

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}
