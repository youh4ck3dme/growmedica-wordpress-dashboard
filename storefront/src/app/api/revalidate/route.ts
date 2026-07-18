import { type NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getRevalidationSecret } from '@/lib/env'
import { timingSafeEqual } from 'node:crypto'

const WOO_TAG_PATTERN =
  /^(woo-products|woo-categories|woo-product-.+|woo-category-.+)$/

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

function resolveSecret(request: NextRequest): string | null {
  const header = request.headers.get('x-revalidation-secret')?.trim()
  if (header) return header

  // Query-string secret only in non-production (legacy local scripts).
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production') {
    return request.nextUrl.searchParams.get('secret')
  }
  return null
}

function revalidateWooTag(tag: string): string[] {
  const revalidated: string[] = []
  if (!WOO_TAG_PATTERN.test(tag)) return revalidated

  revalidateTag(tag)
  revalidated.push(tag)

  if (tag.startsWith('woo-product-')) {
    revalidateTag('woo-products')
    revalidated.push('woo-products')
  }
  if (tag.startsWith('woo-category-')) {
    revalidateTag('woo-categories')
    revalidated.push('woo-categories')
  }

  return revalidated
}

export async function POST(request: NextRequest) {
  let expectedSecret: string
  try {
    expectedSecret = getRevalidationSecret()
  } catch (error) {
    console.error('[Revalidation] Config error:', error)
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const secret = resolveSecret(request)
  if (!secret || !safeEqual(secret, expectedSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tagParam = request.nextUrl.searchParams.get('tag')
    if (tagParam) {
      const tags = revalidateWooTag(tagParam)
      return NextResponse.json({
        revalidated: true,
        provider: 'wordpress',
        tags,
        at: new Date().toISOString(),
      })
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const revalidated: string[] = []

    // Shopify webhook topics no longer accepted — Woo tags only.
    const wooTag = (body as { tag?: string }).tag
    if (typeof wooTag === 'string' && wooTag) {
      revalidated.push(...revalidateWooTag(wooTag))
    }

    return NextResponse.json({
      revalidated: true,
      tags: [...new Set(revalidated)],
      at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Revalidation] Error:', error)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
