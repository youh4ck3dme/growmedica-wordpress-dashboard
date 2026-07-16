import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { revalidateProductCache } from '@/lib/dashboard/revalidate'

type RouteContext = { params: Promise<{ handle: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { handle } = await context.params
  const tags = revalidateProductCache(handle)
  return NextResponse.json({ revalidated: true, tags, at: new Date().toISOString() })
}
