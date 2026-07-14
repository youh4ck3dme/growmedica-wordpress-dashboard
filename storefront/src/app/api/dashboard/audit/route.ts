import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isDashboardAgentAuthorized } from '@/lib/dashboard-agent/auth'
import { listAuditEntries } from '@/lib/dashboard-agent/auditLog'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(request: NextRequest) {
  if (!isDashboardAgentAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const { limit, offset } = querySchema.parse(params)
    const entries = listAuditEntries(limit, offset)
    return NextResponse.json({ entries, limit, offset })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit request failed'
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
