'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useThemeToast } from '@/components/ui/ThemeToast'
import { useT } from '@/components/i18n/LocaleProvider'

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
  const t = useT()
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
        throw new Error(data.error ?? t('bundle.addError'))
      }

      const data = (await response.json()) as { count?: number }
      if (typeof window !== 'undefined' && data.count !== undefined) {
        window.dispatchEvent(new CustomEvent('cart-count-updated', { detail: data.count }))
      }

      setSuccess(true)
      toast({
        title: t('bundle.toastTitle'),
        description: t('bundle.toastDescription'),
        variant: 'success',
      })
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bundle.addErrorGeneric'))
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
        aria-label={t('bundle.addAria')}
      >
        {success ? t('bundle.addedToCart') : t('bundle.addToCart')}
      </Button>
      <Link
        href={productUrl}
        className="block text-center text-xs font-semibold text-(--color-primary) hover:text-(--color-primary-dark)"
      >
        {t('bundle.viewProduct')} →
      </Link>
      {error && (
        <p className="text-xs text-(--color-error) text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
