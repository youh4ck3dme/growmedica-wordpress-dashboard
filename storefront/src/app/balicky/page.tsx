import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { BundleCatalog } from '@/components/bundle/BundleCatalog'
import { BRAND_COPY } from '@/lib/brand'
import { getBundleImageSrc, HEALTH_BUNDLE_CATALOG } from '@/lib/bundles/catalog'
import { getBundleProducts } from '@/lib/catalog/products'
import {
  getBreadcrumbJsonLd,
  getBundleCatalogItemListJsonLd,
  getBundleProductJsonLd,
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
    const bundleProducts = await getBundleProducts(100)
    productsByHandle = mapProductsByBundleSlug(bundleProducts)
  } catch {
    // Catalog backend unreachable
  }

  const liveCount = productsByHandle.size
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Domov', item: siteUrl },
    { name: BRAND_COPY.bundlesHeading, item: `${siteUrl}/balicky` },
  ])
  const itemListJsonLd = getBundleCatalogItemListJsonLd(
    HEALTH_BUNDLE_CATALOG.map((bundle) => ({ name: bundle.name, slug: bundle.slug })),
  )
  const bundleProductJsonLds = HEALTH_BUNDLE_CATALOG.flatMap((bundle) => {
    const product = productsByHandle.get(bundle.slug)
    if (!product) return []
    const staticSrc = getBundleImageSrc(bundle.slug)
    const imageUrl = staticSrc ? `${siteUrl}${staticSrc}` : product.featuredImage?.url
    return [{ slug: bundle.slug, jsonLd: getBundleProductJsonLd(bundle, product, { imageUrl }) }]
  })

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
      {bundleProductJsonLds.map(({ slug, jsonLd }) => (
        <script
          key={slug}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ))}

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
                Produktové stránky sa zobrazia automaticky po vytvorení vo WooCommerce s handle{' '}
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

          <BundleCatalog bundles={HEALTH_BUNDLE_CATALOG} productsByHandle={productsByHandle} />
        </Container>
      </div>
    </>
  )
}
