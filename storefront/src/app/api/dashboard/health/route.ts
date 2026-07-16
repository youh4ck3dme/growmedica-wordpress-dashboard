import { NextResponse } from 'next/server'
import { getCmsProvider } from '@/lib/cms'
import { isShopifyAdminConfigured } from '@/lib/shopify/admin'
import { isShopifyMockMode } from '@/lib/shopify/mock'
import { isWooMockMode } from '@/lib/wordpress/mock'

/** Read-only health check — no auth required. */
export async function GET() {
  const cms = getCmsProvider()
  const mistralMock = process.env.MISTRAL_MOCK_MODE === '1'
  const wooMock = isWooMockMode()
  const shopifyMock = isShopifyMockMode()

  return NextResponse.json({
    ok: true,
    cms_provider: cms,
    mistral: mistralMock ? 'mock' : process.env.MISTRAL_API_KEY ? 'configured' : 'missing',
    catalog: wooMock || shopifyMock ? 'mock' : 'live',
    shopify_admin: isShopifyAdminConfigured() ? 'configured' : 'missing',
    write_mode:
      wooMock || shopifyMock || mistralMock
        ? 'dry_run_only'
        : process.env.DASHBOARD_ALLOW_LIVE_WRITES === '1'
          ? 'live_writes_allowed'
          : 'dry_run_only',
    redis: Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
    ),
  })
}
