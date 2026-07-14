import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIp } from '@/lib/ai/request'
import { isDashboardAgentAuthorized } from '@/lib/dashboard-agent/auth'
import { runDashboardAgent } from '@/lib/dashboard-agent/agentOrchestrator'

const agentInputSchema = z.object({
  command: z.string().min(1).max(4000),
  conversation_id: z.string().max(128).optional(),
})

export async function POST(request: NextRequest) {
  if (!isDashboardAgentAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ip = getClientIp(request)
    const body = await request.json()
    const { command, conversation_id } = agentInputSchema.parse(body)
    const result = await runDashboardAgent({ command, conversation_id, ip })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent request failed'
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
