/** Product card image width — ~2x for 260px display in rails/grids. */
export const PRODUCT_CARD_IMAGE_WIDTH = 520

export const PRODUCT_CARD_IMAGE_SIZES =
  '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px'

/**
 * Request a resized CDN asset before Next.js image optimizer.
 * Supports CDN width query params when present; otherwise returns the original URL.
 */
export function getSizedImageUrl(url: string, width: number = PRODUCT_CARD_IMAGE_WIDTH): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('width', String(width))
    return parsed.toString()
  } catch {
    return url
  }
}
