'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useThemeToast } from '@/components/ui/ThemeToast'

interface BundleAddToCartProps {
  variantId: string
  availableForSale: boolean
  productUrl: string
}

export function BundleAddToCart({
  variantId,
  availableForSale,
  productUrl,
}: BundleAddToCartProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useThemeToast()

  async function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (!availableForSale) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity: 1 }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Balíček sa nepodarilo pridať do košíka.')
      }

      const data = (await response.json()) as { count?: number }
      if (typeof window !== 'undefined' && data.count !== undefined) {
        window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))
      }

      setSuccess(true)
      toast({
        title: 'Balíček v košíku',
        description: 'Môžete pokračovať v nákupe alebo prejsť do pokladne.',
        variant: 'success',
      })
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala chyba pri pridávaní do košíka.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bundle-card__actions mt-4 space-y-2">
      <Button
        type="button"
        variant="primary"
        size="md"
        fullWidth
        disabled={!availableForSale}
        isLoading={isLoading}
        data-testid="bundle-add-to-cart"
        onClick={handleAddToCart}
        aria-label={`Pridať balíček do košíka`}
      >
        {success ? 'Pridané do košíka' : 'Pridať do košíka'}
      </Button>
      <Link
        href={productUrl}
        className="block text-center text-xs font-semibold text-(--color-primary) hover:text-(--color-primary-dark)"
      >
        Detail balíčka →
      </Link>
      {error && (
        <p className="text-xs text-(--color-error) text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
