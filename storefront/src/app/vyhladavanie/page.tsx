import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductGrid } from '@/components/product/ProductGrid'
import { getProducts } from '@/lib/catalog/products'
import { BRAND_COPY } from '@/lib/brand'
import { buildPageMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'

export const metadata: Metadata = {
  ...buildPageMetadata('Vyhľadávanie', BRAND_COPY.pageDescriptions.search, '/vyhladavanie'),
  robots: { index: false },
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function VyhladavaniePage({ searchParams }: SearchPageProps) {
  const locale = await getRequestLocale()
  const { q } = await searchParams
  const query = q?.trim()

  let products: Awaited<ReturnType<typeof getProducts>>['edges'] = []

  if (query) {
    try {
      const data = await getProducts({ first: 48, query })
      products = data.edges
    } catch {
      // catalog not configured
    }
  }

  return (
    <div className="py-8 lg:py-12">
      <Container>
        <form method="GET" action="/vyhladavanie" className="mb-8 max-w-lg">
          <label htmlFor="search-input" className="block text-sm font-medium text-(--color-text) mb-2">
            {t('search.title', locale)}
          </label>
          <div className="flex gap-2">
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t('search.placeholder', locale)}
              autoComplete="off"
              className="flex-1 px-4 py-2.5 rounded-lg border border-(--color-border) text-(--color-text) bg-white focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) transition-colors"
            />
            <button type="submit" className="btn btn-primary" aria-label={t('search.submitAria', locale)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('search.submit', locale)}
            </button>
          </div>
        </form>

        {!query ? (
          <EmptyState
            icon="search"
            title={t('empty.search.noQuery.title', locale)}
            description={t('empty.search.noQuery.description', locale)}
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('empty.search.noResults.title', locale, { query })}
            description={t('empty.search.noResults.description', locale)}
            actionLabel={t('empty.search.allProducts', locale)}
            actionHref="/produkty"
          />
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-(--color-text)">
                {t('search.resultsFor', locale)}{' '}
                <span className="text-(--color-primary)">{query}</span>
              </h1>
              <p className="text-(--color-text-muted) mt-1">
                {t('search.foundCount', locale, { count: products.length })}
              </p>
            </div>
            <ProductGrid
              products={products.map((e) => e.node)}
              emptyTitle={t('empty.products.title', locale)}
              emptyDescription={t('empty.products.description', locale)}
              emptyAction={t('empty.products.action', locale)}
            />
          </>
        )}
      </Container>
    </div>
  )
}
