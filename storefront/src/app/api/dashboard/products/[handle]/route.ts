import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { getProductByHandle } from '@/lib/catalog/products'
import { legacyAdminRemovedResponse } from '@/lib/dashboard/legacy-admin-removed'

type RouteContext = { params: Promise<{ handle: string }> }

/** Product detail from Woo catalog (read-only). Writes → WP admin. */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { handle } = await context.params
  try {
    const product = await getProductByHandle(handle)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ product })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, _context: RouteContext) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return legacyAdminRemovedResponse()
}
