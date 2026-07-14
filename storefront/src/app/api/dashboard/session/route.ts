import { NextResponse } from 'next/server'
import {
  createDashboardSessionToken,
  DASHBOARD_SESSION_COOKIE,
  DASHBOARD_SESSION_MAX_AGE_SEC,
  getDashboardAgentSecret,
} from '@/lib/dashboard-agent/auth'

export async function POST() {
  try {
    getDashboardAgentSecret()
    const token = createDashboardSessionToken()
    const response = NextResponse.json({ ok: true })
    response.cookies.set(DASHBOARD_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DASHBOARD_SESSION_MAX_AGE_SEC,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
