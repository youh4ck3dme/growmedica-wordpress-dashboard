import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const CUSTOMER_SESSION_COOKIE = 'gm_customer_session'
export const CUSTOMER_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30 // 30 days

export type CustomerSession = {
  customerId: number
  email: string
  name: string
  exp: number
}

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SESSION_SECRET?.trim() ||
    process.env.WORDPRESS_REVALIDATION_SECRET?.trim() ||
    process.env.DASHBOARD_AGENT_SECRET?.trim() ||
    ''
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SESSION_SECRET (or WORDPRESS_REVALIDATION_SECRET) must be set (min 16 chars)')
  }
  return secret
}

/** Secret sent to CMS growmedica/v1/auth/* (same option as revalidate when unset). */
export function getCmsAuthSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET?.trim() ||
    process.env.GROWMEDICA_AUTH_SECRET?.trim() ||
    process.env.WORDPRESS_REVALIDATION_SECRET?.trim() ||
    ''
  )
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url')
}

export function encodeCustomerSession(session: Omit<CustomerSession, 'exp'> & { exp?: number }): string {
  const secret = getAuthSecret()
  const body: CustomerSession = {
    customerId: session.customerId,
    email: session.email,
    name: session.name,
    exp: session.exp ?? Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_MAX_AGE_SEC,
  }
  const payloadB64 = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url')
  const sig = signPayload(payloadB64, secret)
  return `${payloadB64}.${sig}`
}

export function decodeCustomerSession(token: string | undefined | null): CustomerSession | null {
  if (!token || !token.includes('.')) return null
  try {
    const secret = getAuthSecret()
    const [payloadB64, sig] = token.split('.', 2)
    if (!payloadB64 || !sig) return null
    const expected = signPayload(payloadB64, secret)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as CustomerSession
    if (
      typeof parsed.customerId !== 'number' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null
    return parsed
  } catch {
    return null
  }
}

export async function readCustomerSessionFromCookies(): Promise<CustomerSession | null> {
  const jar = await cookies()
  return decodeCustomerSession(jar.get(CUSTOMER_SESSION_COOKIE)?.value)
}

export function customerSessionCookieOptions(maxAge = CUSTOMER_SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}
