/**
 * AI rate limiter — Upstash Redis when configured, else in-memory (local/dev only).
 */

const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW_SEC = 60

type RateLimitEntry = {
  count: number
  resetAt: number
}

const memoryLimits: Record<string, RateLimitEntry> = {}

function checkMemoryLimit(
  ip: string,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `ai:${ip}`
  const windowMs = DEFAULT_WINDOW_SEC * 1000
  const entry = memoryLimits[key] ?? { count: 0, resetAt: now + windowMs }

  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }

  if (entry.count >= DEFAULT_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  memoryLimits[key] = entry
  return {
    allowed: true,
    remaining: DEFAULT_LIMIT - entry.count,
    resetAt: entry.resetAt,
  }
}

async function checkUpstashLimit(
  ip: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number } | null> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!baseUrl || !token) return null

  const key = `ai-rl:${ip}`
  try {
    const response = await fetch(`${baseUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, DEFAULT_WINDOW_SEC],
        ['TTL', key],
      ]),
      cache: 'no-store',
    })

    if (!response.ok) return null

    const rows = (await response.json()) as Array<{ result: number }>
    const count = Number(rows[0]?.result ?? 0)
    const ttl = Number(rows[2]?.result ?? DEFAULT_WINDOW_SEC)
    const resetAt = Date.now() + Math.max(ttl, 1) * 1000

    if (count > DEFAULT_LIMIT) {
      return { allowed: false, remaining: 0, resetAt }
    }

    return {
      allowed: true,
      remaining: Math.max(DEFAULT_LIMIT - count, 0),
      resetAt,
    }
  } catch {
    return null
  }
}

export async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const upstash = await checkUpstashLimit(ip)
  if (upstash) return upstash
  return checkMemoryLimit(ip)
}
