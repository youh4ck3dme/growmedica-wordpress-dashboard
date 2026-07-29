import { NextResponse } from 'next/server'
import { cmsRegister } from '@/lib/auth/cms-auth'
import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
  encodeCustomerSession,
} from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { email?: string; password?: string; firstName?: string; lastName?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''

  if (!email || password.length < 8) {
    return NextResponse.json(
      { error: 'Valid email and password (min 8 characters) are required.' },
      { status: 400 },
    )
  }

  const result = await cmsRegister({ email, password, firstName, lastName })
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
  return response
}
