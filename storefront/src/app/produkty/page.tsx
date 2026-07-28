import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Container } from '@/components/ui/Container'
import { FilterableProductList } from '@/components/product/FilterableProductList'
import { getProductsAccumulated, PRODUCTS_PAGE_SIZE } from '@/lib/catalog/products'
import { buildPageMetadata } from '@/lib/seo'
import type { ProductListItem } from '@/lib/catalog/types'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

export const revalidate = 3600

export const metadata: Metadata = buildPageMetadata(
  t('page.products.metaTitle', DEFAULT_LOCALE),
  t('page.products.metaDescription', DEFAULT_LOCALE),
  '/produkty',
)

interface SearchParams {
  q?: string
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function ProduktyPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const query = params.q?.trim() || undefined

  let products: ProductListItem[] = []

  try {
    // Woo REST caps per_page at 100 — accumulate pages instead of asking for 250.
    const productData = await getProductsAccumulated({
      first: PRODUCTS_PAGE_SIZE,
      pages: 'all',
      query,
    })
    products = productData.edges.map((e) => e.node)
  } catch (error) {
    console.error('[ProduktyPage] failed to fetch products:', error)
  }

  return (
    <div className="py-8 lg:py-12 bg-gray-50/50 min-h-screen">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-(--color-text) mb-2">
            {query ? `Výsledky pre: „${query}“` : 'Katalóg produktov'}
          </h1>
          <p className="text-(--color-text-muted) text-sm">
            Objavte našu ponuku prémiových biomedicínskych supplementov a produktov pre vaše zdravie.
          </p>
        </div>

        <Suspense fallback={<p className="text-sm text-(--color-text-muted)">Načítavam filtre…</p>}>
          <FilterableProductList initialProducts={products} initialQuery={query} />
        </Suspense>
      </Container>
    </div>
  )
}

