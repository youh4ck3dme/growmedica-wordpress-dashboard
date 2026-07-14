import { type NextRequest } from 'next/server'

export const DASHBOARD_AGENT_SECRET_HEADER = 'x-dashboard-agent-secret'

export function getDashboardAgentSecret(): string {
  const secret = process.env.DASHBOARD_AGENT_SECRET?.trim()
  if (!secret || secret.length < 16) {
    throw new Error('DASHBOARD_AGENT_SECRET must be at least 16 characters')
  }
  return secret
}

export function isDashboardAgentAuthorized(request: NextRequest): boolean {
  const expected = process.env.DASHBOARD_AGENT_SECRET?.trim()
  if (!expected) return false
  const provided = request.headers.get(DASHBOARD_AGENT_SECRET_HEADER)?.trim()
  return provided === expected
}
