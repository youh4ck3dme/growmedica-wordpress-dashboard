import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { wooFetch, wooMutate } from '@/lib/wordpress/client'
import { isWooMockMode } from '@/lib/wordpress/mock'
import { decodeHtmlEntities } from '@/lib/utils'
import type { WooProduct } from '@/lib/wordpress/types'
import { legacyAdminRemovedResponse } from '@/lib/dashboard/legacy-admin-removed'

/** Inventory snapshot from Woo products (stock_quantity). */
export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isWooMockMode()) {
    return NextResponse.json({ items: [], count: 0, note: 'WOO_MOCK_MODE' })
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 100), 100)
  const threshold = Number(request.nextUrl.searchParams.get('threshold') ?? 100)

  try {
    const products = await wooFetch<WooProduct[]>({
      path: '/products',
      params: {
        per_page: limit,
        status: 'publish',
        orderby: 'title',
        order: 'asc',
      },
      cache: 'no-store',
      revalidate: false,
    })

    const items = products
      .map((p) => ({
        id: p.id,
        handle: p.slug,
        title: decodeHtmlEntities(p.name),
        quantity: p.stock_quantity,
        available: p.stock_status === 'instock' || p.stock_status === 'onbackorder',
        stock_status: p.stock_status,
        sku: p.sku || null,
      }))
      .filter((row) => {
        if (!Number.isFinite(threshold)) return true
        if (row.quantity === null || row.quantity === undefined) return true
        return row.quantity <= threshold
      })

    return NextResponse.json({
      items,
      count: items.length,
      admin: 'https://cms.growmedica.cz/wp-admin/edit.php?post_type=product',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load inventory'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Update stock quantity for a product by slug/handle.
 * Requires DASHBOARD_ALLOW_LIVE_WRITES=1 (same gate as agent write tools).
 */
export async function PUT(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isWooMockMode()) {
    return NextResponse.json({ error: 'WOO_MOCK_MODE — writes disabled' }, { status: 403 })
  }

  if (process.env.DASHBOARD_ALLOW_LIVE_WRITES !== '1') {
    return NextResponse.json(
      {
        error:
          'Live writes disabled. Set DASHBOARD_ALLOW_LIVE_WRITES=1 or edit stock in WP admin.',
        admin: 'https://cms.growmedica.cz/wp-admin/edit.php?post_type=product',
      },
      { status: 403 },
    )
  }

  let body: { handle?: string; quantity?: number }
  try {
    body = (await request.json()) as { handle?: string; quantity?: number }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const handle = body.handle?.trim()
  const quantity = Number(body.quantity)
  if (!handle || !Number.isFinite(quantity) || quantity < 0) {
    return NextResponse.json({ error: 'handle and non-negative quantity required' }, { status: 400 })
  }

  try {
    const found = await wooFetch<WooProduct[]>({
      path: '/products',
      params: { slug: handle, per_page: 1 },
      cache: 'no-store',
      revalidate: false,
    })
    const product = found[0]
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const updated = await wooMutate<WooProduct>({
      path: `/products/${product.id}`,
      method: 'PUT',
      body: {
        manage_stock: true,
        stock_quantity: Math.floor(quantity),
        stock_status: quantity > 0 ? 'instock' : 'outofstock',
      },
    })

    return NextResponse.json({
      ok: true,
      handle: updated.slug,
      quantity: updated.stock_quantity,
      available: updated.stock_status === 'instock',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update inventory'
    // If credentials lack write scope, surface clear guidance
    if (message.includes('401') || message.includes('403')) {
      return legacyAdminRemovedResponse()
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
