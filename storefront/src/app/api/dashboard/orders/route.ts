import { type NextRequest } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { NextResponse } from 'next/server'
import { legacyAdminRemovedResponse } from '@/lib/dashboard/legacy-admin-removed'

export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return legacyAdminRemovedResponse()
}
