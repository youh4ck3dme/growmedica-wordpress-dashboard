import Image from 'next/image'
import Link from 'next/link'
import type { ProductListItem } from '@/lib/shopify/types'
import {
  getShopifySizedImageUrl,
  PRODUCT_CARD_IMAGE_SIZES,
} from '@/lib/shopify/image-url'
import { getProductUrl } from '@/lib/utils'
import { Price } from '@/components/ui/Price'
import { WishlistButton } from '@/components/product/WishlistButton'

interface ProductCardProps {
  product: ProductListItem
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.featuredImage
  const firstVariant = product.variants.edges[0]?.node
  const price = firstVariant?.price ?? product.priceRange.minVariantPrice
  const compareAtPrice = firstVariant?.compareAtPrice ?? product.compareAtPriceRange.minVariantPrice

  const hasDiscount =
    compareAtPrice &&
    parseFloat(compareAtPrice.amount) > parseFloat(price.amount)

  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(price.amount) / parseFloat(compareAtPrice!.amount)) * 100)
    : 0

  const imageSrc = image ? getShopifySizedImageUrl(image.url) : '/images/product-placeholder.svg'

  return (
    <article className="product-card noor-product-card group" aria-label={product.title}>
      <div className="relative">
        <Link
          href={getProductUrl(product.handle)}
          className="block relative"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="product-card__media relative aspect-square noor-product-media overflow-hidden bg-white">
            <Image
              src={imageSrc}
              alt={image?.altText ?? product.title}
              fill
              sizes={PRODUCT_CARD_IMAGE_SIZES}
              quality={75}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              className="product-card__image object-contain p-3"
            />

            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="btn-icon flex items-center justify-center shadow-md" aria-hidden="true">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
          </div>

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!product.availableForSale && (
              <span className="badge badge-error">Momentálne vypredané</span>
            )}
            {hasDiscount && product.availableForSale && (
              <span className="badge badge-sale">Zľava {discountPct}%</span>
            )}
          </div>
        </Link>
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton
            productHandle={product.handle}
            productTitle={product.title}
            variant="icon"
          />
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1 gap-1.5">
        {product.vendor && (
          <p className="text-[0.7rem] text-(--color-text-muted) font-semibold uppercase tracking-wider leading-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {product.vendor}
          </p>
        )}

        <h3 className="text-sm font-semibold text-(--color-text) leading-snug line-clamp-2 flex-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <Link
            href={getProductUrl(product.handle)}
            className="hover:text-(--color-primary) transition-colors"
          >
            {product.title}
          </Link>
        </h3>

        <p className="product-card__stock text-xs font-semibold">
          {product.availableForSale ? '✓ Dostupné skladom' : '✗ Momentálne vypredané'}
        </p>

        <Price
          price={price}
          compareAtPrice={hasDiscount ? compareAtPrice : null}
          size="sm"
        />

        <Link
          href={getProductUrl(product.handle)}
          id={`product-cta-${product.handle}`}
          className="btn btn-primary btn-sm btn-full mt-1"
          aria-label={`Detail produktu: ${product.title}`}
        >
          Zobraziť produkt
        </Link>
      </div>
    </article>
  )
}
