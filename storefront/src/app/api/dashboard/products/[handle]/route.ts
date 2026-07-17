import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { revalidateProductCache } from '@/lib/dashboard/revalidate'
import { getAdminProductByHandle, isLiveWriteAllowed, updateAdminProduct } from '@/lib/shopify/admin'
import { appendAuditEntry, hashArgs } from '@/lib/dashboard-agent/auditLog'
import { getClientIp } from '@/lib/ai/request'

type RouteContext = { params: Promise<{ handle: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { handle } = await context.params
  try {
    const product = await getAdminProductByHandle(handle)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ product })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  available: z.boolean().optional(),
  inventoryQuantity: z.number().int().min(0).optional(),
  confirm: z.boolean().optional(),
})

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { handle } = await context.params
  const ip = getClientIp(request)

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

    const product = await updateAdminProduct(handle, {
      title: body.title,
      description: body.description,
      price: body.price,
      available: body.available,
      inventoryQuantity: body.inventoryQuantity,
    })

    const tags = revalidateProductCache(handle)

    await appendAuditEntry({
      ip,
      conversation_id: 'dashboard-panel',
      tool: 'get_product',
      status: 'ok',
      summary: `Updated product ${handle}`,
      args_hash: hashArgs(body),
    })

    return NextResponse.json({ product, revalidated: tags })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product'
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
