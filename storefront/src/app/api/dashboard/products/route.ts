import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { getProducts } from '@/lib/catalog/products'
import { shopifyAdminRemovedResponse } from '@/lib/dashboard/shopify-removed'

/** List products from Woo catalog (read-only). Writes → WP admin. */
export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams.get('search') ?? undefined
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 20)

  try {
    const result = await getProducts({ first: Math.min(limit, 50), search, page: 1 })
    const products = result.edges.map((e) => e.node)
    return NextResponse.json({ products, count: products.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return shopifyAdminRemovedResponse()
}
