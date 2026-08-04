import { NextResponse } from 'next/server'
import {
  CUSTOMER_LOGGED_IN_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
  loggedInFlagCookieOptions,
} from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(CUSTOMER_SESSION_COOKIE, '', {
    ...customerSessionCookieOptions(0),
    maxAge: 0,
  })
  response.cookies.set(CUSTOMER_LOGGED_IN_COOKIE, '', {
    ...loggedInFlagCookieOptions(0),
    maxAge: 0,
  })
  return response
}
