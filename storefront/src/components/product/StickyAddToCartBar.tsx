'use client'

import { useEffect, useState } from 'react'
import type { Money } from '@/lib/catalog/types'
import { Price } from '@/components/ui/Price'
import { Button } from '@/components/ui/Button'
import { useT } from '@/components/i18n/LocaleProvider'
import { addToCartRequest, dispatchCartCountUpdated } from '@/lib/catalog/cart-client'

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
  const t = useT()
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
      const data = await addToCartRequest(variantId, 1, t('cart.addError'))
      dispatchCartCountUpdated(data.count)
    } catch {
      // Sticky bar stays silent; main buy-box shows detailed errors.
    } finally {
      setIsLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className="sticky-atc-bar lg:hidden" role="region" aria-label={t('cart.addStickyAria')}>
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
          aria-label={t('cart.add')}
        >
          {availableForSale ? t('cart.add') : t('product.soldOutBadge')}
        </Button>
      </div>
    </div>
  )
}
