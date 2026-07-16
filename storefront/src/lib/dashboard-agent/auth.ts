import { createHmac, randomUUID } from 'node:crypto'
import { type NextRequest } from 'next/server'

export const DASHBOARD_AGENT_SECRET_HEADER = 'x-dashboard-agent-secret'
export const DASHBOARD_SESSION_COOKIE = 'growmedica-dashboard-agent-session'
export const DASHBOARD_SESSION_MAX_AGE_SEC = 24 * 60 * 60

export function getDashboardAgentSecret(): string {
  const secret = process.env.DASHBOARD_AGENT_SECRET?.trim()
  if (!secret || secret.length < 16) {
    throw new Error('DASHBOARD_AGENT_SECRET must be at least 16 characters')
  }
  return secret
}

function signSessionId(sessionId: string): string {
  const secret = process.env.DASHBOARD_AGENT_SECRET?.trim()
  if (!secret) return ''
  return createHmac('sha256', secret).update(sessionId).digest('hex').slice(0, 32)
}

export function createDashboardSessionToken(): string {
  const sessionId = randomUUID()
  const signature = signSessionId(sessionId)
  return `${sessionId}.${signature}`
}

export function verifyDashboardSessionToken(token: string | null | undefined): boolean {
  if (!token?.trim()) return false
  const [sessionId, signature] = token.split('.')
  if (!sessionId || !signature) return false
  const expected = signSessionId(sessionId)
  return expected.length > 0 && signature === expected
}

export function isDashboardAgentAuthorized(request: NextRequest): boolean {
  const expected = process.env.DASHBOARD_AGENT_SECRET?.trim()
  if (!expected) return false

  const provided = request.headers.get(DASHBOARD_AGENT_SECRET_HEADER)?.trim()
  if (provided === expected) return true

  const sessionToken = request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value
  return verifyDashboardSessionToken(sessionToken)
}

/** Alias used by dashboard API routes. */
export function authorizeDashboardRequest(request: NextRequest): boolean {
  return isDashboardAgentAuthorized(request)
}

export function isDashboardSecretValid(secret: string | null | undefined): boolean {
  const expected = process.env.DASHBOARD_AGENT_SECRET?.trim()
  if (!expected || !secret?.trim()) return false
  return secret.trim() === expected
}
