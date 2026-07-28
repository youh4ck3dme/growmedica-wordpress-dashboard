import { type NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getRevalidationSecret } from '@/lib/env'
import { timingSafeEqual } from 'node:crypto'

const WOO_TAG_PATTERN =
  /^(woo-products|woo-categories|woo-featured-products|woo-product-.+|woo-category-.+|woo-product-id-.+)$/

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
    const pathParam = request.nextUrl.searchParams.get('path')
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const revalidatedTags: string[] = []
    const revalidatedPaths: string[] = []

    if (tagParam) {
      revalidatedTags.push(...revalidateWooTag(tagParam))
    }

    const bodyTag = body.tag
    if (typeof bodyTag === 'string' && bodyTag) {
      revalidatedTags.push(...revalidateWooTag(bodyTag))
    }

    const bodyTags = body.tags
    if (Array.isArray(bodyTags)) {
      for (const tag of bodyTags) {
        if (typeof tag === 'string' && tag) {
          revalidatedTags.push(...revalidateWooTag(tag))
        }
      }
    }

    const paths: string[] = []
    if (typeof pathParam === 'string' && pathParam.startsWith('/')) paths.push(pathParam)
    if (typeof body.path === 'string' && body.path.startsWith('/')) paths.push(body.path)
    if (Array.isArray(body.paths)) {
      for (const path of body.paths) {
        if (typeof path === 'string' && path.startsWith('/')) paths.push(path)
      }
    }

    for (const path of [...new Set(paths)]) {
      revalidatePath(path)
      revalidatedPaths.push(path)
    }

    return NextResponse.json({
      revalidated: true,
      provider: 'wordpress',
      tags: [...new Set(revalidatedTags)],
      paths: revalidatedPaths,
      at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Revalidation] Error:', error)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
