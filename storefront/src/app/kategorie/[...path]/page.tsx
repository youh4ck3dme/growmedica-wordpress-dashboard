import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CollectionHero from '@/components/collection/CollectionHero'
import { FilterableProductList } from '@/components/product/FilterableProductList'
import { Container } from '@/components/ui/Container'
import {
  getFrozenCategoryAncestors,
  getFrozenCategoryByPath,
  getFrozenCategoryLabel,
  getFrozenCategorySeo,
  getFrozenCategorySiblingsWithCounts,
  getSeoTaxonomyCollectionViewAll,
} from '@/lib/seo-taxonomy'
import { buildLocaleAlternates, resolvePageRobots } from '@/lib/seo'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

export const revalidate = 3600

type PageProps = {
  params: Promise<{ path: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const path = (await params).path.join('/')
  const locale = DEFAULT_LOCALE
  const category = getFrozenCategoryByPath(path)
  if (!category) {
    return { title: t('empty.category.title', locale), robots: resolvePageRobots(false) }
  }
  const seo = getFrozenCategorySeo(category.categoryId, locale)
  const label = getFrozenCategoryLabel(category, locale)
  const shouldIndex = category.indexRecommendation === 'INDEX CANDIDATE'
  return {
    title: { absolute: seo?.title ?? `${label} | GrowMedica` },
    description: seo?.metaDescription,
    alternates: buildLocaleAlternates(`/kategorie/${path}`),
    robots: resolvePageRobots(shouldIndex),
    openGraph: {
      title: seo?.title ?? label,
      description: seo?.metaDescription,
      type: 'website',
      url: `/kategorie/${path}`,
    },
  }
}

export default async function SeoCategoryPage({ params }: PageProps) {
  const path = (await params).path.join('/')
  const locale = await getRequestLocale()
  const category = getFrozenCategoryByPath(path)
  if (!category) notFound()
  const view = await getSeoTaxonomyCollectionViewAll(path, locale)
  if (!view) notFound()
  const ancestors = getFrozenCategoryAncestors(category)
  const siblingCategories = await getFrozenCategorySiblingsWithCounts(category, locale)

  return (
    <div className="py-8 lg:py-12">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-(--color-text-muted)">
            <li><Link href="/">{t('page.breadcrumbHome', locale)}</Link></li>
            {[...ancestors, category].map((item, index, list) => {
              const label = getFrozenCategoryLabel(item, locale)
              return (
              <li key={item.categoryId} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                {index === list.length - 1 ? (
                  <span aria-current="page" className="font-medium text-(--color-text)">{label}</span>
                ) : (
                  <Link href={`/kategorie/${item.localizedPaths?.sk ?? ''}`}>{label}</Link>
                )}
              </li>
              )
            })}
          </ol>
        </nav>

        <CollectionHero
          handle={view.handle}
          title={view.title}
          description={view.description}
          productCount={view.products.length}
          imageUrl={view.imageUrl}
        />
        <Suspense fallback={<p className="text-sm text-(--color-text-muted)">Načítavam filtre…</p>}>
          <FilterableProductList initialProducts={view.products} siblingCategories={siblingCategories} />
        </Suspense>
      </Container>
    </div>
  )
}
