import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createDashboardSessionToken,
  DASHBOARD_AGENT_SECRET_HEADER,
  DASHBOARD_SESSION_COOKIE,
  DASHBOARD_SESSION_MAX_AGE_SEC,
  getDashboardAgentSecret,
  isDashboardSecretValid,
  verifyDashboardSessionToken,
} from '@/lib/dashboard-agent/auth'

const sessionInputSchema = z.object({
  secret: z.string().min(1).max(256).optional(),
})

function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(DASHBOARD_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DASHBOARD_SESSION_MAX_AGE_SEC,
  })
}

export async function POST(request: NextRequest) {
  try {
    getDashboardAgentSecret()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const existing = request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value
  if (verifyDashboardSessionToken(existing)) {
    const response = NextResponse.json({ ok: true, authenticated: true })
    setSessionCookie(response, existing!)
    return response
  }

  let bodySecret: string | undefined
  try {
    const body = await request.json()
    bodySecret = sessionInputSchema.parse(body).secret
  } catch {
    bodySecret = undefined
  }

  const headerSecret = request.headers.get(DASHBOARD_AGENT_SECRET_HEADER)?.trim()
  const providedSecret = bodySecret?.trim() || headerSecret

  if (!isDashboardSecretValid(providedSecret)) {
    return NextResponse.json({ error: 'Invalid dashboard secret', authenticated: false }, { status: 401 })
  }

  const token = createDashboardSessionToken()
  const response = NextResponse.json({ ok: true, authenticated: true })
  setSessionCookie(response, token)
  return response
}
