import { NextResponse } from 'next/server'

/** Shared response when a legacy Shopify Admin dashboard endpoint is hit. */
export const SHOPIFY_ADMIN_REMOVED_MESSAGE =
  'Shopify Admin bol odstránený zo storefrontu. Správu objednávok, skladu a produktov rob v WordPress admin: https://cms.growmedica.cz/wp-admin'

export function shopifyAdminRemovedResponse() {
  return NextResponse.json(
    {
      error: SHOPIFY_ADMIN_REMOVED_MESSAGE,
      shopify: 'removed',
      admin: 'https://cms.growmedica.cz/wp-admin',
    },
    { status: 410 },
  )
}
