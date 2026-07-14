import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductGrid } from '@/components/product/ProductGrid'
import { getProducts } from '@/lib/catalog/products'
import { BRAND_COPY } from '@/lib/brand'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildPageMetadata('Vyhľadávanie', BRAND_COPY.pageDescriptions.search),
  robots: { index: false },
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function VyhladavaniePage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim()

  let products: Awaited<ReturnType<typeof getProducts>>['edges'] = []

  if (query) {
    try {
      const data = await getProducts({ first: 48, query })
      products = data.edges
    } catch {
      // Shopify nie je nakonfigurovaný
    }
  }

  return (
    <div className="py-8 lg:py-12">
      <Container>
        {/* Search form */}
        <form method="GET" action="/vyhladavanie" className="mb-8 max-w-lg">
          <label htmlFor="search-input" className="block text-sm font-medium text-(--color-text) mb-2">
            Vyhľadávanie
          </label>
          <div className="flex gap-2">
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Hľadajte produkty…"
              autoComplete="off"
              className="flex-1 px-4 py-2.5 rounded-lg border border-(--color-border) text-(--color-text) bg-white focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) transition-colors"
            />
            <button type="submit" className="btn btn-primary" aria-label="Hľadať">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Hľadať
            </button>
          </div>
        </form>

        {/* Results */}
        {!query ? (
          <EmptyState
            icon="search"
            title="Zadajte hľadaný výraz"
            description="Napíšte názov produktu, značku alebo kategóriu."
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon="search"
            title={`Nič sme nenašli pre „${query}"`}
            description="Skúste iný výraz alebo prezrite všetky produkty."
            actionLabel="Všetky produkty"
            actionHref="/produkty"
          />
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-(--color-text)">
                Výsledky pre: <span className="text-(--color-primary)">{query}</span>
              </h1>
              <p className="text-(--color-text-muted) mt-1">
                Nájdených {products.length} produktov
              </p>
            </div>
            <ProductGrid products={products.map((e) => e.node)} />
          </>
        )}
      </Container>
    </div>
  )
}
