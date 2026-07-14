'use client'

import { useEffect, useState } from 'react'
import type { Money } from '@/lib/shopify/types'
import { Price } from '@/components/ui/Price'
import { Button } from '@/components/ui/Button'

interface StickyAddToCartBarProps {
  productTitle: string
  price: Money
  compareAtPrice: Money | null
  availableForSale: boolean
  variantId?: string
}

export default function StickyAddToCartBar({
  productTitle,
  price,
  compareAtPrice,
  availableForSale,
  variantId,
}: StickyAddToCartBarProps) {
  const [visible, setVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const target = document.getElementById('product-buy-box')
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  async function handleAdd() {
    if (!variantId || !availableForSale) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity: 1 }),
      })
      if (!response.ok) throw new Error('Cart add failed')
      const data = (await response.json()) as { count?: number }
      if (typeof window !== 'undefined' && data.count !== undefined) {
        window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className="sticky-atc-bar lg:hidden" role="region" aria-label="Rýchle pridanie produktu do košíka">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-(--color-text)">{productTitle}</p>
          <Price price={price} compareAtPrice={compareAtPrice} size="sm" />
        </div>
        <Button
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={!availableForSale}
          onClick={handleAdd}
          aria-label="Pridať do košíka"
        >
          {availableForSale ? 'Pridať do košíka' : 'Momentálne vypredané'}
        </Button>
      </div>
    </div>
  )
}
