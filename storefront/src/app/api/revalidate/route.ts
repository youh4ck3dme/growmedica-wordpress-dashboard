import { type NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getRevalidationSecret } from '@/lib/env'

export async function POST(request: NextRequest) {
  let expectedSecret: string
  try {
    expectedSecret = getRevalidationSecret()
  } catch (error) {
    console.error('[Revalidation] Config error:', error)
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const secret = request.headers.get('x-revalidation-secret')

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const topic = request.headers.get('x-shopify-topic') ?? ''

    if (topic.startsWith('products/')) {
      revalidateTag('products')
      const handle = (body as { handle?: string }).handle
      if (handle) revalidateTag(`product-${handle}`)
    }

    if (topic.startsWith('collections/')) {
      revalidateTag('collections')
      const handle = (body as { handle?: string }).handle
      if (handle) revalidateTag(`collection-${handle}`)
    }

    return NextResponse.json({ revalidated: true, at: new Date().toISOString() })
  } catch (error) {
    console.error('[Revalidation] Error:', error)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
