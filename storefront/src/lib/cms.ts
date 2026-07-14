export type CmsProvider = 'shopify' | 'wordpress'

/** Active CMS backend for catalog data. Defaults to Shopify when CMS_PROVIDER is omitted. */
export function getCmsProvider(): CmsProvider {
  const forced = process.env.CMS_PROVIDER?.trim().toLowerCase()
  if (forced === 'wordpress' || forced === 'shopify') {
    return forced
  }

  return 'shopify'
}

export function isWordPressCms(): boolean {
  return getCmsProvider() === 'wordpress'
}
