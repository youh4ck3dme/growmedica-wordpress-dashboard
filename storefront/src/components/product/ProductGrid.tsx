import type { ProductListItem } from '@/lib/shopify/types'
import { ProductCard } from './ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'

interface ProductGridProps {
  products: ProductListItem[]
  emptyTitle?: string
  emptyDescription?: string
}

export function ProductGrid({
  products,
  emptyTitle = 'Žiadne produkty',
  emptyDescription = 'Momentálne tu nie sú žiadne produkty.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon="products"
        title={emptyTitle}
        description={emptyDescription}
        actionLabel="Zobraziť všetky produkty"
        actionHref="/produkty"
      />
    )
  }

  return (
    <div className="noor-featured-rail product-grid" role="list" aria-label="Zoznam produktov">
      {products.map((product, index) => (
        <div key={product.id} role="listitem">
          <ProductCard product={product} priority={index < 4} />
        </div>
      ))}
    </div>
  )
}
