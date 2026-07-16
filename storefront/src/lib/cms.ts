export type CmsProvider = 'shopify' | 'wordpress'

/**
 * Active CMS backend for catalog data.
 * Defaults to wordpress (live production). Set CMS_PROVIDER=shopify explicitly for Shopify.
 */
export function getCmsProvider(): CmsProvider {
  const forced = process.env.CMS_PROVIDER?.trim().toLowerCase()
  if (forced === 'wordpress' || forced === 'shopify') {
    return forced
  }

  // Fail-safe for production deploys missing CMS_PROVIDER.
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return 'wordpress'
  }

  return 'wordpress'
}

export function isWordPressCms(): boolean {
  return getCmsProvider() === 'wordpress'
}
