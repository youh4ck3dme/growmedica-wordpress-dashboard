'use client'

import { useState } from 'react'
import type { Product, ProductVariant } from '@/lib/shopify/types'
import { Price } from '@/components/ui/Price'
import VariantSelector from '@/components/product/VariantSelector'
import AddToCartButton from '@/components/product/AddToCartButton'
import StickyAddToCartBar from '@/components/product/StickyAddToCartBar'
import { WishlistButton } from '@/components/product/WishlistButton'

interface ProductPurchasePanelProps {
  product: Product
}

export default function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.edges[0]?.node ?? null,
  )

  const firstVariant = product.variants.edges[0]?.node
  const displayVariant = selectedVariant ?? firstVariant
  const price = displayVariant?.price ?? product.priceRange.minVariantPrice
  const compareAt =
    displayVariant?.compareAtPrice ?? product.compareAtPriceRange.minVariantPrice

  return (
    <>
      <div id="product-buy-box" className="space-y-6">
        <Price price={price} compareAtPrice={compareAt} size="lg" />
        <VariantSelector product={product} onVariantChange={setSelectedVariant} />
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <AddToCartButton
              variants={product.variants.edges.map((e) => e.node)}
              availableForSale={product.availableForSale}
              selectedVariantId={displayVariant?.id}
            />
          </div>
          <WishlistButton
            productHandle={product.handle}
            productTitle={product.title}
            variant="full"
            className="shrink-0 h-[48px]"
          />
        </div>
        <ul className="space-y-2">
          {[
            '✓ Overená kvalita a prehľadné zloženie',
            '✓ Odoslanie do 24 hodín v pracovné dni',
            '✓ Vrátenie tovaru do 30 dní',
          ].map((benefit) => (
            <li key={benefit} className="text-sm text-(--color-text-muted)">
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <StickyAddToCartBar
        productTitle={product.title}
        price={price}
        compareAtPrice={compareAt}
        availableForSale={displayVariant?.availableForSale ?? product.availableForSale}
        variantId={displayVariant?.id}
      />
    </>
  )
}
