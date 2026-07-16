import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { isLiveWriteAllowed, listAdminInventory, updateInventoryQuantity } from '@/lib/shopify/admin'
import { revalidateProductCache } from '@/lib/dashboard/revalidate'

export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const threshold = Number(request.nextUrl.searchParams.get('threshold') ?? 5)
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50)

  try {
    const items = await listAdminInventory({ lowStockThreshold: threshold, limit })
    return NextResponse.json({ items, count: items.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list inventory'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const updateSchema = z.object({
  handle: z.string().min(1),
  quantity: z.number().int().min(0),
  confirm: z.boolean().optional(),
})

export async function PUT(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = updateSchema.parse(await request.json())

    if (!body.confirm || !isLiveWriteAllowed()) {
      return NextResponse.json(
        {
          error: 'Live writes require confirm=true and DASHBOARD_ALLOW_LIVE_WRITES=1',
          dry_run: true,
        },
        { status: 403 },
      )
    }

    const item = await updateInventoryQuantity(body.handle, body.quantity)
    const tags = revalidateProductCache(body.handle)
    return NextResponse.json({ item, revalidated: tags })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update inventory'
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
