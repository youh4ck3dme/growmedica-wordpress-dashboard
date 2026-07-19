import { type NextRequest, NextResponse } from 'next/server'
import { authorizeDashboardRequest } from '@/lib/dashboard-agent/auth'
import { getCmsProvider } from '@/lib/cms'
import { isWooMockMode } from '@/lib/wordpress/mock'

/** Public probe — minimal surface for uptime checks. */
export async function GET(request: NextRequest) {
  if (!authorizeDashboardRequest(request)) {
    return NextResponse.json({ ok: true })
  }

  const cms = getCmsProvider()
  const mistralMock = process.env.MISTRAL_MOCK_MODE === '1'
  const wooMock = isWooMockMode()

  return NextResponse.json({
    ok: true,
    cms_provider: cms,
    mistral: mistralMock ? 'mock' : process.env.MISTRAL_API_KEY ? 'configured' : 'missing',
    catalog: wooMock ? 'mock' : 'live',
    admin: 'wordpress',
    admin_url: 'https://cms.growmedica.cz/wp-admin',
    write_mode:
      wooMock || mistralMock
        ? 'dry_run_only'
        : process.env.DASHBOARD_ALLOW_LIVE_WRITES === '1'
          ? 'live_writes_allowed'
          : 'dry_run_only',
    redis: Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
    ),
  })
}
