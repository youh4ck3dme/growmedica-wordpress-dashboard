'use client'

import type { ProductListItem } from '@/lib/catalog/types'
import { ProductCard } from './ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useT } from '@/components/i18n/LocaleProvider'

interface ProductGridProps {
  products: ProductListItem[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: string
  listAriaLabel?: string
}

export function ProductGrid({
  products,
  emptyTitle,
  emptyDescription,
  emptyAction,
  listAriaLabel,
}: ProductGridProps) {
  const t = useT()
  const resolvedEmptyTitle = emptyTitle ?? t('empty.products.title')
  const resolvedEmptyDescription = emptyDescription ?? t('empty.products.description')
  const resolvedEmptyAction = emptyAction ?? t('empty.products.action')
  const resolvedListAria = listAriaLabel ?? t('aria.productList')

  if (products.length === 0) {
    return (
      <EmptyState
        icon="products"
        title={resolvedEmptyTitle}
        description={resolvedEmptyDescription}
        actionLabel={resolvedEmptyAction}
        actionHref="/produkty"
      />
    )
  }

  return (
    <div className="noor-featured-rail product-grid" role="list" aria-label={resolvedListAria}>
      {products.map((product, index) => (
        <div key={product.id} role="listitem">
          <ProductCard product={product} priority={index < 4} />
        </div>
      ))}
    </div>
  )
}
