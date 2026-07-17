import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { BundleGrid } from '@/components/bundle/BundleGrid'
import { BRAND_COPY } from '@/lib/brand'
import { HEALTH_BUNDLE_CATALOG } from '@/lib/bundles/catalog'
import { getBundleProducts } from '@/lib/catalog/products'
import {
  getBreadcrumbJsonLd,
  getBundleCatalogItemListJsonLd,
  getBundlesPageMetadata,
  serializeJsonLd,
} from '@/lib/seo'
import { resolvePublicSiteUrl } from '@/lib/site-url'

export const revalidate = 3600

export const metadata: Metadata = getBundlesPageMetadata()

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
    }
  }

  return map
}

export default async function BalickyPage() {
  const siteUrl = resolvePublicSiteUrl()
  let productsByHandle = new Map<string, Awaited<ReturnType<typeof getBundleProducts>>[number]>()

  try {
    const shopifyBundles = await getBundleProducts(100)
    productsByHandle = mapProductsByBundleSlug(shopifyBundles)
  } catch {
    // Shopify not configured
  }

  const liveCount = productsByHandle.size
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Domov', item: siteUrl },
    { name: BRAND_COPY.bundlesHeading, item: `${siteUrl}/balicky` },
  ])
  const itemListJsonLd = getBundleCatalogItemListJsonLd(
    HEALTH_BUNDLE_CATALOG.map((bundle) => ({ name: bundle.name, slug: bundle.slug })),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListJsonLd) }}
      />

      <div className="py-10 lg:py-16 bg-(--color-bg) min-h-[70vh]">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-(--color-text-muted)">
              <li>
                <Link href="/" className="hover:text-(--color-primary) transition-colors">
                  Domov
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-(--color-text) font-medium" aria-current="page">
                {BRAND_COPY.bundlesHeading}
              </li>
            </ol>
          </nav>

          <BrandPageHeader
            title={BRAND_COPY.bundlesHeading}
            subtitle={BRAND_COPY.bundlesSubheading}
            centered={false}
            className="mb-8"
          />

          {liveCount === 0 && (
            <div className="mb-8 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-sm text-(--color-text-muted)">
              <p>
                Katalóg obsahuje <strong>{HEALTH_BUNDLE_CATALOG.length} navrhovaných balíčkov</strong>.
                Produktové stránky sa zobrazia automaticky po vytvorení v Shopify s tagom{' '}
                <code className="text-(--color-text)">balicek-zdravia</code> a handle{' '}
                <code className="text-(--color-text)">balicek-{'{slug}'}</code>.
              </p>
              <p className="mt-2">
                Návod na nastavenie nájdete v dokumentácii projektu{' '}
                <code className="text-(--color-text)">BUNDLE_CATALOG.md</code> alebo nás{' '}
                <Link href="/kontakt" className="text-(--color-primary) underline">
                  kontaktujte
                </Link>
                .
              </p>
            </div>
          )}

          <BundleGrid productsByHandle={productsByHandle} />
        </Container>
      </div>
    </>
  )
}
