/** Product card image width — ~2x for 260px display in rails/grids. */
export const PRODUCT_CARD_IMAGE_WIDTH = 520

export const PRODUCT_CARD_IMAGE_SIZES =
  '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px'

/**
 * Request a resized CDN asset before Next.js image optimizer.
 * Shopify CDN honors `width`; WordPress/CMS URLs are returned unchanged
 * (query params are unused there and only complicate /_next/image allowlisting).
 */
export function getSizedImageUrl(url: string, width: number = PRODUCT_CARD_IMAGE_WIDTH): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    if (host === 'cdn.shopify.com' || host.endsWith('.shopify.com')) {
      parsed.searchParams.set('width', String(width))
      return parsed.toString()
    }
    return url
  } catch {
    return url
  }
}
