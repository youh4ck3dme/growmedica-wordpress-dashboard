'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ShopifyImage } from '@/lib/shopify/types'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: ShopifyImage[]
  title: string
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? images[0]

  if (!active) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-(--color-surface-2) flex items-center justify-center">
        <span className="text-(--color-text-light) text-sm">Bez fotografie</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-(--color-surface-2)">
        <Image
          src={active.url}
          alt={active.altText ?? title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" role="list" aria-label="Ďalšie fotky produktu">
          {images.slice(0, 8).map((img, i) => {
            const selected = i === activeIndex
            return (
              <button
                key={img.id ?? i}
                type="button"
                role="listitem"
                aria-label={`Fotka ${i + 1}${selected ? ', vybraná' : ''}`}
                aria-current={selected ? 'true' : undefined}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden bg-(--color-surface-2) border transition-colors',
                  selected
                    ? 'border-(--color-primary) ring-2 ring-(--color-primary-light)'
                    : 'border-(--color-border) hover:border-(--color-primary)',
                )}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} - fotka ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
