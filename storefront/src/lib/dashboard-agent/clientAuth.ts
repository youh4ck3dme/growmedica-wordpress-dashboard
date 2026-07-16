'use client'

/** Ensures dashboard session cookie exists (requires valid secret). */
export async function ensureDashboardSession(secret?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/dashboard/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secret ? { secret } : {}),
    })
    if (response.ok) return true
    return false
  } catch {
    return false
  }
}

/** Check if session cookie is valid without creating one. */
export async function checkDashboardSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/dashboard/session', {
      method: 'POST',
      credentials: 'include',
    })
    const body = (await response.json()) as { authenticated?: boolean }
    return response.ok && body.authenticated === true
  } catch {
    return false
  }
}

/** Fetch wrapper for dashboard API routes (session cookie auth). */
export async function dashboardFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, { ...init, credentials: 'include' })
}
