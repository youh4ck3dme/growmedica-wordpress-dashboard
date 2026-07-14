import type { ProductListItem } from '@/lib/shopify/types'
import { ProductCard } from './ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'

interface ProductGridProps {
  products: ProductListItem[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: string
  listAriaLabel?: string
}

export function ProductGrid({
  products,
  emptyTitle = 'Žiadne produkty',
  emptyDescription = 'Momentálne tu nie sú žiadne produkty.',
  emptyAction = 'Zobraziť všetky produkty',
  listAriaLabel = 'Product list',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon="products"
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyAction}
        actionHref="/produkty"
      />
    )
  }

  return (
    <div className="noor-featured-rail product-grid" role="list" aria-label={listAriaLabel}>
      {products.map((product, index) => (
        <div key={product.id} role="listitem">
          <ProductCard product={product} priority={index < 4} />
        </div>
      ))}
    </div>
  )
}
