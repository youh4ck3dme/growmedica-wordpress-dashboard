import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { FilterableProductList } from '@/components/product/FilterableProductList'
import { getProductsAccumulated } from '@/lib/catalog/products'
import { BRAND_COPY } from '@/lib/brand'
import { buildPageMetadata } from '@/lib/seo'
import type { ProductListItem } from '@/lib/shopify/types'

export const revalidate = 3600

export const metadata: Metadata = buildPageMetadata(
  'Produkty',
  BRAND_COPY.pageDescriptions.products,
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
    const productData = await getProductsAccumulated({
      first: 250,
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

        <FilterableProductList initialProducts={products} initialQuery={query} />
      </Container>
    </div>
  )
}

