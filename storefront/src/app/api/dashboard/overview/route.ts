import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { listAuditEntries } from '@/lib/dashboard-agent/auditLog'
import { getProductsAccumulated } from '@/lib/catalog/products'
import { getCollections } from '@/lib/catalog/collections'
import { wooFetch } from '@/lib/wordpress/client'
import { isWooMockMode } from '@/lib/wordpress/mock'
import { decodeHtmlEntities } from '@/lib/utils'

type WooOrderLite = {
  id: number
  number: string
  total: string
  currency: string
  status: string
  date_created: string
}

/** Overview from Woo catalog + recent orders. */
export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [catalog, collections, audit, recentOrders] = await Promise.all([
      getProductsAccumulated({ pages: 1, first: 250 }),
      getCollections(50),
      listAuditEntries(5, 0),
      (async () => {
        if (isWooMockMode()) return [] as WooOrderLite[]
        try {
          return await wooFetch<WooOrderLite[]>({
            path: '/orders',
            params: { per_page: 5, orderby: 'date', order: 'desc', status: 'any' },
            cache: 'no-store',
            revalidate: false,
          })
        } catch {
          return [] as WooOrderLite[]
        }
      })(),
    ])

    const unavailable = catalog.edges.filter((e) => !e.node.availableForSale).length

    return NextResponse.json({
      product_count: catalog.edges.length,
      collection_count: collections.length,
      low_stock_count: null,
      unavailable_count: unavailable,
      recent_orders: recentOrders.map((o) => ({
        name: `#${decodeHtmlEntities(String(o.number || o.id))}`,
        total: o.total,
        currency: o.currency || 'EUR',
        financialStatus: o.status,
        createdAt: o.date_created,
      })),
      recent_audit: audit,
      note: 'Live data from WooCommerce. Full edit: https://cms.growmedica.cz/wp-admin',
      admin: 'https://cms.growmedica.cz/wp-admin',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load overview'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
