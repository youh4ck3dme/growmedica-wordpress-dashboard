import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { listAdminProducts } from '@/lib/shopify/admin'

export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams.get('search') ?? undefined
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 20)

  try {
    const products = await listAdminProducts({ search, limit })
    return NextResponse.json({ products, count: products.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const updateSchema = z.object({
  handle: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  confirm: z.boolean().optional(),
})

export async function PUT(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = updateSchema.parse(await request.json())
    const { updateAdminProduct, isLiveWriteAllowed } = await import('@/lib/shopify/admin')

    if (!body.confirm && !isLiveWriteAllowed()) {
      return NextResponse.json(
        { error: 'Live writes require confirm=true and DASHBOARD_ALLOW_LIVE_WRITES=1', dry_run: true },
        { status: 403 },
      )
    }

    const product = await updateAdminProduct(body.handle, {
      title: body.title,
      description: body.description,
      price: body.price,
    })
    const { revalidateProductCache } = await import('@/lib/dashboard/revalidate')
    const tags = revalidateProductCache(body.handle)
    return NextResponse.json({ product, revalidated: tags })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product'
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
