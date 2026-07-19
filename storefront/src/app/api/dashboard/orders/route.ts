import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { wooFetch } from '@/lib/wordpress/client'
import { isWooMockMode } from '@/lib/wordpress/mock'
import { decodeHtmlEntities } from '@/lib/utils'

type WooOrder = {
  id: number
  number: string
  status: string
  date_created: string
  currency: string
  total: string
  billing?: {
    first_name?: string
    last_name?: string
    email?: string
  }
  payment_method_title?: string
}

function mapFinancialStatus(status: string): string {
  if (status === 'completed' || status === 'processing') return status
  if (status === 'pending' || status === 'on-hold') return status
  if (status === 'cancelled' || status === 'refunded' || status === 'failed') return status
  return status
}

function mapFulfillment(status: string): string {
  if (status === 'completed') return 'fulfilled'
  if (status === 'processing' || status === 'on-hold') return 'unfulfilled'
  if (status === 'cancelled' || status === 'refunded' || status === 'failed') return status
  return 'unknown'
}

/** List recent WooCommerce orders (read-only). */
export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isWooMockMode()) {
    return NextResponse.json({ orders: [], count: 0, note: 'WOO_MOCK_MODE — no live orders' })
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 30), 50)

  try {
    const raw = await wooFetch<WooOrder[]>({
      path: '/orders',
      params: {
        per_page: limit,
        orderby: 'date',
        order: 'desc',
        status: 'any',
      },
      cache: 'no-store',
      revalidate: false,
    })

    const orders = raw.map((order) => {
      const first = order.billing?.first_name?.trim() ?? ''
      const last = order.billing?.last_name?.trim() ?? ''
      const customerName = [first, last].filter(Boolean).join(' ') || '—'
      return {
        id: String(order.id),
        name: `#${order.number || order.id}`,
        createdAt: order.date_created,
        financialStatus: mapFinancialStatus(order.status),
        fulfillmentStatus: mapFulfillment(order.status),
        total: order.total,
        currency: order.currency || 'EUR',
        customerName: decodeHtmlEntities(customerName),
        customerEmail: order.billing?.email ?? '',
        paymentMethod: order.payment_method_title ?? '',
      }
    })

    return NextResponse.json({
      orders,
      count: orders.length,
      admin: 'https://cms.growmedica.cz/wp-admin/edit.php?post_type=shop_order',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list orders'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
