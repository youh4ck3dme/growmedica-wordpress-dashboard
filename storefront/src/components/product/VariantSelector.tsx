'use client'

import { useState, useEffect } from 'react'
import type { Product, ProductVariant } from '@/lib/shopify/types'
import { cn } from '@/lib/utils'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'

interface VariantSelectorProps {
  product: Product
  onVariantChange?: (variant: ProductVariant | null) => void
}

export default function VariantSelector({ product, onVariantChange }: VariantSelectorProps) {
  const variants = product.variants.edges.map((e) => e.node)
  const options = product.options.filter((o) => o.name !== 'Title' && o.values.length > 1)

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    options.forEach((opt) => {
      initial[opt.name] = opt.values[0]
    })
    return initial
  })

  // Find the matching variant for the current selection
  const selectedVariant = variants.find((variant) =>
    variant.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    )
  )

  useEffect(() => {
    onVariantChange?.(selectedVariant ?? null)
  }, [selectedVariant, onVariantChange])

  const { theme } = useStorefrontTheme()

  if (options.length === 0) return null

  function isOptionAvailable(optionName: string, optionValue: string): boolean {
    const testOptions = { ...selectedOptions, [optionName]: optionValue }
    return variants.some(
      (v) =>
        v.availableForSale &&
        v.selectedOptions.every((opt) => testOptions[opt.name] === opt.value)
    )
  }

  function handleSelect(optionName: string, value: string) {
    setSelectedOptions((prev: Record<string, string>) => ({ ...prev, [optionName]: value }))
  }

  return (
    <div className="space-y-4" role="group" aria-label="Vyberte variant produktu">
      {options.map((option) => (
        <div key={option.id}>
          <div className="flex items-center gap-2 mb-2">
            <label
              className="text-sm font-semibold text-(--color-text)"
              id={`option-label-${option.name}`}
            >
              {option.name}:
            </label>
            <span className="text-sm text-(--color-text-muted)">
              {selectedOptions[option.name]}
            </span>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-labelledby={`option-label-${option.name}`}
          >
            {option.values.map((value) => {
              const available = isOptionAvailable(option.name, value)
              const selected = selectedOptions[option.name] === value

              return (
                <button
                  key={value}
                  id={`variant-${option.name}-${value}`}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${option.name}: ${value}${!available ? ' (nedostupné)' : ''}`}
                  disabled={!available}
                  onClick={() => handleSelect(option.name, value)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium border transition-all min-h-[44px]',
                    selected
                      ? theme === 'noor'
                        ? 'border-(--noor-ink) bg-(--noor-ink) text-white'
                        : 'border-(--color-primary) bg-(--color-primary) text-white'
                      : available
                      ? 'border-(--color-border) text-(--color-text) hover:border-(--color-primary) hover:text-(--color-primary)'
                      : 'border-(--color-border) text-(--color-text-light) opacity-50 cursor-not-allowed line-through'
                  )}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Variant info */}
      {selectedVariant && (
        <div className="text-xs text-(--color-text-muted) pt-1">
          {selectedVariant.sku && <span>SKU: {selectedVariant.sku}</span>}
          {selectedVariant.quantityAvailable !== null &&
            selectedVariant.quantityAvailable > 0 &&
            selectedVariant.quantityAvailable <= 10 && (
              <span className="ml-3 text-(--color-warning) font-medium">
                Zostatok: {selectedVariant.quantityAvailable} ks
              </span>
            )}
        </div>
      )}
    </div>
  )
}
