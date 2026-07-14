import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import ProductGallery from '@/components/product/ProductGallery'
import ProductPurchasePanel from '@/components/product/ProductPurchasePanel'
import ProductTabs from '@/components/product/ProductTabs'
import { ProductReviews } from '@/components/product/ProductReviews'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductFitBox } from '@/components/ai/ProductFitBox'
import {
  getProductByHandle,
  getRelatedProducts,
  getProductCompositionHtml,
  getAllProductHandlesForSitemap,
} from '@/lib/catalog/products'
import { getProductMetadata, getProductJsonLd, getBreadcrumbJsonLd } from '@/lib/seo'
import { getCollectionUrl } from '@/lib/utils'
import { getCategoryDefinition, resolveCategory } from '@/lib/category-map'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const products = await getAllProductHandlesForSitemap()
    return products.map(({ handle }) => ({ handle }))
  } catch (error) {
    console.error('[ProductPage] generateStaticParams failed:', error)
    return []
  }
}

interface ProductPageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) return { title: 'Produkt nenájdený' }
  return getProductMetadata(product)
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) notFound()

  const p = product
  const categorySlug = resolveCategory({ productType: p.productType, tags: p.tags })
  const categoryDef = getCategoryDefinition(categorySlug)
  const images = p.images.edges.map((e) => e.node)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://growmedica.nexify-studio.tech'

  const [relatedProducts] = await Promise.all([
    categorySlug !== 'ostatne'
      ? getRelatedProducts(categorySlug, p.handle, 4)
      : Promise.resolve([]),
  ])

  const compositionHtml = getProductCompositionHtml(p)

  const productJsonLd = getProductJsonLd(p)
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Domov', item: siteUrl },
    ...(categorySlug !== 'ostatne'
      ? [{ name: categoryDef.title, item: `${siteUrl}${getCollectionUrl(categorySlug)}` }]
      : []),
    { name: p.title, item: `${siteUrl}/produkty/${p.handle}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="py-8 lg:py-12">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-(--color-text-muted)">
              <li>
                <Link href="/" className="hover:text-(--color-primary) transition-colors">
                  Domov
                </Link>
              </li>
              <li aria-hidden="true" className="text-(--color-text-light)">/</li>
              {categorySlug !== 'ostatne' && (
                <>
                  <li>
                    <Link
                      href={getCollectionUrl(categorySlug)}
                      className="hover:text-(--color-primary) transition-colors"
                    >
                      {categoryDef.title}
                    </Link>
                  </li>
                  <li aria-hidden="true" className="text-(--color-text-light)">/</li>
                </>
              )}
              <li
                className="text-(--color-text) font-medium truncate max-w-xs sm:max-w-md"
                aria-current="page"
              >
                {p.title}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <ProductGallery images={images} title={p.title} />

            <div className="space-y-6">
              <div>
                {p.vendor && (
                  <p className="text-sm font-medium text-(--color-primary) uppercase tracking-wide mb-2">
                    {p.vendor}
                  </p>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-(--color-text) leading-tight text-balance mb-3">
                  {p.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.availableForSale ? (
                    <Badge variant="success">Dostupné skladom</Badge>
                  ) : (
                    <Badge variant="error">Momentálne vypredané</Badge>
                  )}
                  {p.productType && <Badge variant="muted">{p.productType}</Badge>}
                  {categorySlug !== 'ostatne' && (
                    <Link href={getCollectionUrl(categorySlug)}>
                      <Badge variant="brand">{categoryDef.title}</Badge>
                    </Link>
                  )}
                </div>
              </div>

              <ProductPurchasePanel product={p} />

              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-(--color-border)">
                  {p.tags.map((tag) => (
                    <span key={tag} className="badge badge-muted text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <ProductFitBox handle={p.handle} productTitle={p.title} />
            </div>
          </div>

          <ProductTabs
            descriptionHtml={p.descriptionHtml || null}
            compositionHtml={compositionHtml}
          />

          <ProductReviews
            productHandle={p.handle}
            productTitle={p.title}
          />

          {relatedProducts.length > 0 && (
            <section className="mt-14" aria-labelledby="related-products-heading">
              <h2 id="related-products-heading" className="section-heading mb-6">
                Mohlo by sa vám hodiť
              </h2>
              <ProductGrid products={relatedProducts} />
            </section>
          )}
        </Container>
      </div>
    </>
  )
}
