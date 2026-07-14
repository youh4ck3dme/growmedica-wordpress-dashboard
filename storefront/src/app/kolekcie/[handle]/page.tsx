import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Container } from '@/components/ui/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import CollectionHero from '@/components/collection/CollectionHero'
import CollectionToolbar from '@/components/collection/CollectionToolbar'
import {
  getCollectionViewByHandle,
  type CollectionListOptions,
} from '@/lib/catalog/nav'
import { getCollectionMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'

export const revalidate = 3600

interface CollectionPageProps {
  params: Promise<{ handle: string }>
  searchParams: Promise<{
    page?: string
    sort?: string
    vendor?: string
    stock?: string
  }>
}

function parseListOptions(searchParams: {
  page?: string
  sort?: string
  vendor?: string
  stock?: string
}): CollectionListOptions {
  const sort = searchParams.sort
  const validSort =
    sort === 'price-asc' || sort === 'price-desc' || sort === 'title'
      ? sort
      : 'recommended'

  return {
    page: Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1),
    sort: validSort,
    vendor: searchParams.vendor || undefined,
    inStockOnly: searchParams.stock === '1',
  }
}

function buildPageHref(
  handle: string,
  page: number,
  searchParams: { sort?: string; vendor?: string; stock?: string },
): string {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (searchParams.sort && searchParams.sort !== 'recommended') {
    params.set('sort', searchParams.sort)
  }
  if (searchParams.vendor) params.set('vendor', searchParams.vendor)
  if (searchParams.stock === '1') params.set('stock', '1')
  const qs = params.toString()
  return qs ? `/kolekcie/${handle}?${qs}` : `/kolekcie/${handle}`
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params
  const view = await getCollectionViewByHandle(handle)
  if (!view) return { title: 'Kolekcia nenájdená' }

  return getCollectionMetadata({
    handle: view.handle,
    title: view.title,
    description: view.description ?? '',
    descriptionHtml: view.description ?? '',
    seo: { title: view.title, description: view.description ?? '' },
    updatedAt: new Date().toISOString(),
    image: null,
    id: view.handle,
  })
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const locale = await getRequestLocale()
  const { handle } = await params
  const rawSearch = await searchParams
  const listOptions = parseListOptions(rawSearch)

  let view: Awaited<ReturnType<typeof getCollectionViewByHandle>> = null

  try {
    view = await getCollectionViewByHandle(handle, listOptions)
  } catch {
    notFound()
  }

  if (!view) notFound()

  const page = listOptions.page ?? 1
  const productCount = view.totalOnPage

  return (
    <div className="py-8 lg:py-12">
      <Container>
        <nav aria-label={t('aria.breadcrumb', locale)} className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-(--color-text-muted)">
            <li><Link href="/" className="hover:text-(--color-primary) transition-colors">{t('common.home', locale)}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/kolekcie" className="hover:text-(--color-primary) transition-colors">{t('nav.collections', locale)}</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-(--color-text) font-medium" aria-current="page">{view.title}</li>
          </ol>
        </nav>

        <CollectionHero
          handle={view.handle}
          title={view.title}
          description={view.description}
          productCount={productCount}
        />

        <Suspense fallback={null}>
          <CollectionToolbar vendors={view.availableVendors} totalOnPage={view.totalOnPage} />
        </Suspense>

        <ProductGrid
          products={view.products}
          emptyTitle={t('empty.collection.title', locale)}
          emptyDescription={t('empty.collection.description', locale)}
          emptyAction={t('empty.products.action', locale)}
          listAriaLabel={t('aria.productList', locale)}
        />

        {(view.hasPreviousPage || view.hasNextPage) && (
          <nav
            className="mt-10 flex items-center justify-center gap-4"
            aria-label={t('aria.collectionPagination', locale)}
          >
            {view.hasPreviousPage ? (
              <Link
                href={buildPageHref(view.handle, page - 1, rawSearch)}
                className="btn btn-secondary"
              >
                {t('common.previous', locale)}
              </Link>
            ) : (
              <span className="btn btn-secondary opacity-40 pointer-events-none" aria-hidden="true">
                {t('common.previous', locale)}
              </span>
            )}
            <span className="text-sm text-(--color-text-muted)">{t('common.page', locale, { page: String(view.page) })}</span>
            {view.hasNextPage ? (
              <Link
                href={buildPageHref(view.handle, page + 1, rawSearch)}
                className="btn btn-secondary"
              >
                {t('common.next', locale)}
              </Link>
            ) : (
              <span className="btn btn-secondary opacity-40 pointer-events-none" aria-hidden="true">
                {t('common.next', locale)}
              </span>
            )}
          </nav>
        )}
      </Container>
    </div>
  )
}
