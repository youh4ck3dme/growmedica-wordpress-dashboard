import { NextResponse } from 'next/server'
import { cmsLogin } from '@/lib/auth/cms-auth'
import {
  CUSTOMER_LOGGED_IN_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
  encodeCustomerSession,
  loggedInFlagCookieOptions,
} from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = (await request.json()) as { email?: string; password?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const result = await cmsLogin(email, password)
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  const token = encodeCustomerSession({
    customerId: result.data.customerId,
    email: result.data.email,
    name: result.data.name,
  })

  const response = NextResponse.json({
    customer: {
      customerId: result.data.customerId,
      email: result.data.email,
      name: result.data.name,
      billing: result.data.billing ?? {},
      shipping: result.data.shipping ?? {},
    },
  })
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions())
  response.cookies.set(CUSTOMER_LOGGED_IN_COOKIE, '1', loggedInFlagCookieOptions())
  return response
}
