'use client'

import { useState } from 'react'
import type { ProductVariant } from '@/lib/shopify/types'
import { Button } from '@/components/ui/Button'
import { useThemeToast } from '@/components/ui/ThemeToast'

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
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity: 1 }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? 'Produkt sa nepodarilo pridať do košíka. Skúste to znova.')
      }

      const data = await response.json() as { count?: number }
      
      if (typeof window !== 'undefined' && data.count !== undefined) {
        window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))
      }

      setSuccess(true)
      toast({
        title: 'Pridané do košíka',
        description: 'Položka je v košíku. Môžete pokračovať v nákupe.',
        variant: 'success',
      })
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala neočakávaná chyba. Skúste to prosím znova.')
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
        aria-label="Produkt je momentálne vypredaný"
      >
        Momentálne vypredané
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
        aria-label="Pridať produkt do košíka"
      >
        {success ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pridané do košíka
          </span>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pridať do košíka
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
