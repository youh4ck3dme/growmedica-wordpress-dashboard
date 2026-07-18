import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { listAuditEntries } from '@/lib/dashboard-agent/auditLog'
import { getProductsAccumulated } from '@/lib/catalog/products'
import { getCollections } from '@/lib/catalog/collections'

/** Overview from Woo catalog only (Shopify Admin stats removed). */
export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [catalog, collections, audit] = await Promise.all([
      getProductsAccumulated({ pages: 1, first: 250 }),
      getCollections(50),
      listAuditEntries(5, 0),
    ])

    const unavailable = catalog.edges.filter((e) => !e.node.availableForSale).length

    return NextResponse.json({
      product_count: catalog.edges.length,
      collection_count: collections.length,
      low_stock_count: null,
      unavailable_count: unavailable,
      recent_orders: [],
      recent_audit: audit,
      note: 'Orders/inventory use WordPress admin — Shopify Admin removed',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load overview'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
