import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CollectionHero from '@/components/collection/CollectionHero'
import CollectionToolbar from '@/components/collection/CollectionToolbar'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Container } from '@/components/ui/Container'
import type { CollectionListOptions } from '@/lib/catalog/nav'
import {
  getFrozenCategoryAncestors,
  getFrozenCategoryByPath,
  getFrozenCategorySeo,
  getSeoTaxonomyCollectionView,
} from '@/lib/seo-taxonomy'
import { buildLocaleAlternates } from '@/lib/seo'

export const revalidate = 3600

type PageProps = {
  params: Promise<{ path: string[] }>
  searchParams: Promise<{ page?: string; sort?: string; vendor?: string; stock?: string }>
}

function parseOptions(search: Awaited<PageProps['searchParams']>): CollectionListOptions {
  const sort = search.sort
  return {
    page: Math.max(1, Number.parseInt(search.page ?? '1', 10) || 1),
    sort:
      sort === 'price-asc' || sort === 'price-desc' || sort === 'title'
        ? sort
        : 'recommended',
    vendor: search.vendor || undefined,
    inStockOnly: search.stock === '1',
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const path = (await params).path.join('/')
  const category = getFrozenCategoryByPath(path)
  if (!category) return { title: 'Kategória nenájdená', robots: { index: false, follow: false } }
  const seo = getFrozenCategorySeo(category.categoryId)
  const shouldIndex = category.indexRecommendation === 'INDEX CANDIDATE'
  return {
    title: { absolute: seo?.title ?? `${category.labels.sk} | GrowMedica` },
    description: seo?.metaDescription,
    alternates: buildLocaleAlternates(`/kategorie/${path}`),
    robots: { index: shouldIndex, follow: true },
    openGraph: {
      title: seo?.title ?? category.labels.sk,
      description: seo?.metaDescription,
      type: 'website',
      url: `/kategorie/${path}`,
    },
  }
}

export default async function SeoCategoryPage({ params, searchParams }: PageProps) {
  const path = (await params).path.join('/')
  const category = getFrozenCategoryByPath(path)
  if (!category) notFound()
  const search = await searchParams
  const options = parseOptions(search)
  const view = await getSeoTaxonomyCollectionView(path, options)
  if (!view) notFound()
  const ancestors = getFrozenCategoryAncestors(category)

  return (
    <div className="py-8 lg:py-12">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-(--color-text-muted)">
            <li><Link href="/">Domov</Link></li>
            {[...ancestors, category].map((item, index, list) => (
              <li key={item.categoryId} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                {index === list.length - 1 ? (
                  <span aria-current="page" className="font-medium text-(--color-text)">{item.labels.sk}</span>
                ) : (
                  <Link href={`/kategorie/${item.localizedPaths?.sk ?? ''}`}>{item.labels.sk}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <CollectionHero
          handle={view.handle}
          title={view.title}
          description={view.description}
          productCount={view.totalOnPage}
        />
        <Suspense fallback={null}>
          <CollectionToolbar vendors={view.availableVendors} totalOnPage={view.totalOnPage} />
        </Suspense>
        <ProductGrid
          products={view.products}
          emptyTitle="V tejto kategórii zatiaľ nie sú produkty"
          emptyDescription="Skúste nadradenú kategóriu alebo sa vráťte do obchodu."
          emptyAction="Zobraziť všetky produkty"
          listAriaLabel={`Produkty v kategórii ${view.title}`}
        />
      </Container>
    </div>
  )
}
