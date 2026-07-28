'use client'

import { useState } from 'react'
import type { ProductVariant } from '@/lib/catalog/types'
import { Button } from '@/components/ui/Button'
import { useThemeToast } from '@/components/ui/ThemeToast'
import { useT } from '@/components/i18n/LocaleProvider'
import { addToCartRequest, dispatchCartCountUpdated } from '@/lib/catalog/cart-client'

interface AddToCartButtonProps {
  variants: ProductVariant[]
  availableForSale: boolean
  selectedVariantId?: string
}

export default function AddToCartButton({
  variants,
  availableForSale,
  selectedVariantId,
}: AddToCartButtonProps) {
  const t = useT()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useThemeToast()

  const variantId = selectedVariantId ?? variants[0]?.id
  const selectedVariant = variants.find((v) => v.id === variantId)
  const inStock = selectedVariant?.availableForSale ?? availableForSale

  async function handleAddToCart() {
    if (!variantId || !inStock) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await addToCartRequest(variantId, 1, t('cart.addError'))
      dispatchCartCountUpdated(data.count)

      setSuccess(true)
      toast({
        title: t('cart.addedTitle'),
        description: t('cart.addedDescription'),
        variant: 'success',
      })
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'TimeoutError'
          ? t('cart.addErrorGeneric')
          : err instanceof Error
            ? err.message
            : t('cart.addErrorGeneric')
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!inStock) {
    return (
      <Button
        id="add-to-cart-btn"
        variant="ghost"
        size="lg"
        fullWidth
        disabled
        aria-label={t('cart.soldOutAria')}
      >
        {t('product.soldOutBadge')}
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        id="add-to-cart-btn"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        onClick={handleAddToCart}
        aria-label={t('cart.addAria')}
      >
        {success ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('cart.addedTitle')}
          </span>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('cart.add')}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-(--color-error) text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
