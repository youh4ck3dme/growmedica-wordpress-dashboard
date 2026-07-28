import Link from 'next/link'
import { BundleGrid } from '@/components/bundle/BundleGrid'
import {
  getFeaturedBundles,
  HEALTH_BUNDLE_CATALOG,
} from '@/lib/bundles/catalog'
import { getBundleProducts } from '@/lib/catalog/products'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'

function mapProductsByBundleSlug(
  products: Awaited<ReturnType<typeof getBundleProducts>>,
): Map<string, (typeof products)[number]> {
  const map = new Map<string, (typeof products)[number]>()

  for (const product of products) {
    const slugFromHandle = product.handle.startsWith('balicek-')
      ? product.handle.slice('balicek-'.length)
      : null
    if (slugFromHandle) {
      map.set(slugFromHandle, product)
      continue
    }

    const catalogMatch = HEALTH_BUNDLE_CATALOG.find(
      (b) => product.tags.some((tag) => tag.toLowerCase() === `balicek-${b.slug}`),
    )
    if (catalogMatch) {
      map.set(catalogMatch.slug, product)
    }
  }

  return map
}

interface BundleShowcaseProps {
  limit?: number
  showHeader?: boolean
  showViewAll?: boolean
}

export async function BundleShowcase({
  limit = 6,
  showHeader = true,
  showViewAll = true,
}: BundleShowcaseProps) {
  const locale = await getRequestLocale()
  let productsByHandle = new Map<string, Awaited<ReturnType<typeof getBundleProducts>>[number]>()

  try {
    const shopifyBundles = await getBundleProducts(limit * 2)
    productsByHandle = mapProductsByBundleSlug(shopifyBundles)
  } catch {
    // Shopify not configured
  }

  const featured = getFeaturedBundles(limit)

  return (
    <div>
      {showHeader && (
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">{t('home.bundlesLabel', locale)}</p>
            <h2 id="bundles-heading" className="section-heading noor-display-heading">
              {t('home.bundlesHeading', locale)}
            </h2>
            <p className="mt-2 text-sm text-(--color-text-muted) max-w-2xl">
              {t('home.bundlesSubheading', locale)}
            </p>
          </div>
          {showViewAll && (
            <Link
              href="/balicky"
              className="text-sm font-semibold text-(--color-primary) hover:text-(--color-primary-dark) transition-colors shrink-0"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {t('home.bundlesViewAll', locale)} →
            </Link>
          )}
        </div>
      )}

      <BundleGrid bundles={featured} productsByHandle={productsByHandle} />
    </div>
  )
}
