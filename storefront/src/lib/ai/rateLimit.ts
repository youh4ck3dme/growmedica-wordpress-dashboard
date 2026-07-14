/**
 * In-memory rate limiter (fallback for local dev only).
 * TODO: Replace with Upstash Redis (@upstash/ratelimit) for Vercel production.
 */

const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW_MS = 60_000

type RateLimitEntry = {
  count: number
  resetAt: number
}

const limits: Record<string, RateLimitEntry> = {}

export async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const key = `ai:${ip}`
  const entry = limits[key] ?? { count: 0, resetAt: now + DEFAULT_WINDOW_MS }

  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + DEFAULT_WINDOW_MS
  }

  if (entry.count >= DEFAULT_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  limits[key] = entry
  return {
    allowed: true,
    remaining: DEFAULT_LIMIT - entry.count,
    resetAt: entry.resetAt,
  }
}
