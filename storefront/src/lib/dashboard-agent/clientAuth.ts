'use client'

/** Ensures dashboard session cookie exists before API calls. */
export async function ensureDashboardSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/dashboard/session', {
      method: 'POST',
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
}

/** Fetch wrapper for dashboard API routes (session cookie auth). */
export async function dashboardFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  await ensureDashboardSession()
  return fetch(input, { ...init, credentials: 'include' })
}
