import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { listAuditEntries } from '@/lib/dashboard-agent/auditLog'
import { getProductsAccumulated } from '@/lib/catalog/products'
import { getCollections } from '@/lib/catalog/collections'
import { listAdminInventory, listAdminOrders } from '@/lib/shopify/admin'

export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [catalog, collections, orders, lowStock, audit] = await Promise.all([
      getProductsAccumulated({ pages: 1, first: 250 }),
      getCollections(50),
      listAdminOrders(5),
      listAdminInventory({ lowStockThreshold: 5, limit: 100 }),
      listAuditEntries(5, 0),
    ])

    const unavailable = lowStock.filter((i) => !i.available).length

    return NextResponse.json({
      product_count: catalog.edges.length,
      collection_count: collections.length,
      low_stock_count: lowStock.length,
      unavailable_count: unavailable,
      recent_orders: orders,
      recent_audit: audit,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load overview'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
