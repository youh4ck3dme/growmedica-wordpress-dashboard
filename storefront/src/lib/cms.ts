export type CmsProvider = 'wordpress'

/**
 * Active CMS backend for catalog data.
 * Shopify runtime has been removed — storefront is WooCommerce-only.
 */
export function getCmsProvider(): CmsProvider {
  return 'wordpress'
}

export function isWordPressCms(): boolean {
  return true
}
