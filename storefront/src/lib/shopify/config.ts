/** Shopify Storefront API tokenless access (no X-Shopify-Storefront-Access-Token header). */
export function isShopifyTokenlessMode(): boolean {
  return process.env.SHOPIFY_STOREFRONT_TOKENLESS === '1'
}

export function buildStorefrontHeaders(apiVersion: string, accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Shopify-Api-Version': apiVersion,
  }

  if (!isShopifyTokenlessMode() && accessToken) {
    headers['X-Shopify-Storefront-Access-Token'] = accessToken
  }

  return headers
}