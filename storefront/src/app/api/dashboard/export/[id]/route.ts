import { type NextRequest, NextResponse } from 'next/server'
import { isDashboardAgentAuthorized } from '@/lib/dashboard-agent/auth'
import { getExport } from '@/lib/dashboard-agent/exports'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isDashboardAgentAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const record = getExport(id)
  if (!record) {
    return NextResponse.json({ error: 'Export not found or expired' }, { status: 404 })
  }

  return new NextResponse(record.content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${record.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
