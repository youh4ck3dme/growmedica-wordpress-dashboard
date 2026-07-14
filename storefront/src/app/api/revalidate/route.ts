import { type NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getRevalidationSecret } from '@/lib/env'

const WOO_TAG_PATTERN =
  /^(woo-products|woo-categories|woo-product-.+|woo-category-.+)$/

function resolveSecret(request: NextRequest): string | null {
  const header = request.headers.get('x-revalidation-secret')
  if (header) return header
  return request.nextUrl.searchParams.get('secret')
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
  if (secret !== expectedSecret) {
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
    const topic = request.headers.get('x-shopify-topic') ?? ''
    const revalidated: string[] = []

    if (topic.startsWith('products/')) {
      revalidateTag('products')
      revalidated.push('products')
      const handle = (body as { handle?: string }).handle
      if (handle) {
        revalidateTag(`product-${handle}`)
        revalidated.push(`product-${handle}`)
      }
    }

    if (topic.startsWith('collections/')) {
      revalidateTag('collections')
      revalidated.push('collections')
      const handle = (body as { handle?: string }).handle
      if (handle) {
        revalidateTag(`collection-${handle}`)
        revalidated.push(`collection-${handle}`)
      }
    }

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