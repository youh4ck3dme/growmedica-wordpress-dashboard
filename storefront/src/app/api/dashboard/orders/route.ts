import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { listAdminOrders } from '@/lib/shopify/admin'

export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 20)

  try {
    const orders = await listAdminOrders(limit)
    return NextResponse.json({ orders, count: orders.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list orders'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
