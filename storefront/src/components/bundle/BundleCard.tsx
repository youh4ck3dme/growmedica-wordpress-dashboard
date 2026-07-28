'use client'

import Image from 'next/image'
import {
  Activity,
  Apple,
  Bone,
  Brain,
  CalendarDays,
  Droplet,
  FlaskConical,
  Flame,
  Heart,
  Leaf,
  Moon,
  Package,
  Pill,
  Shield,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import {
  BUNDLE_CATEGORY_BENEFITS,
  BUNDLE_CATEGORY_LABELS,
  getBundleImageSrc,
  isHighlightedBundle,
  type HealthBundle,
} from '@/lib/bundles/catalog'
import { getProductUrl } from '@/lib/utils'
import type { ProductListItem } from '@/lib/catalog/types'
import { BundleAddToCart } from '@/components/bundle/BundleAddToCart'
import { useLocale, useT } from '@/components/i18n/LocaleProvider'
import {
  getBundleCategoryBenefit,
  getBundleCategoryLabel,
  getBundleDisclaimer,
  getBundleName,
} from '@/lib/i18n/bundles'

const CATEGORY_ICONS: Record<HealthBundle['category'], LucideIcon> = {
  imunita: Shield,
  'spanok-stres': Moon,
  'sportova-vyziva': Activity,
  regeneracia: Flame,
  'klby-pohyb': Bone,
  'srdce-cievy': Heart,
  travenie: Leaf,
  'detox-pecen': Droplet,
  'krasa-pokozka': Sparkles,
  'vitaminy-mineraly': Pill,
  proteiny: Flame,
  aminokyseliny: FlaskConical,
  'specialna-vyziva': Brain,
  'zdrave-potraviny': Apple,
  sezonne: CalendarDays,
  ostatne: Package,
}

interface BundleCardProps {
  bundle: HealthBundle
  product?: ProductListItem | null
}

export function BundleCard({ bundle, product }: BundleCardProps) {
  const t = useT()
  const { locale } = useLocale()
  const name = getBundleName(bundle.slug, locale, bundle.name)
  const categoryLabel = getBundleCategoryLabel(
    bundle.category,
    locale,
    BUNDLE_CATEGORY_LABELS[bundle.category],
  )
  const benefit = getBundleCategoryBenefit(
    bundle.category,
    locale,
    BUNDLE_CATEGORY_BENEFITS[bundle.category],
  )
  const disclaimer = getBundleDisclaimer(bundle, locale)

  const variant = product?.variants.edges[0]?.node
  const price = variant?.price ?? product?.priceRange.minVariantPrice
  const compareAt = variant?.compareAtPrice ?? product?.compareAtPriceRange.minVariantPrice

  const hasShopifyPrice = Boolean(product && price)
  const hasDiscount =
    hasShopifyPrice &&
    compareAt &&
    parseFloat(compareAt.amount) > parseFloat(price!.amount)

  const CategoryIcon = CATEGORY_ICONS[bundle.category]
  const highlighted = isHighlightedBundle(bundle.slug)
  const staticImage = getBundleImageSrc(bundle.slug)
  const wooImage = product?.featuredImage?.url
  const imageSrc = staticImage ?? wooImage ?? null
  const imageAlt = product?.featuredImage?.altText || t('bundle.ui.imageAlt', { name })

  return (
    <article
      className="bundle-card liquid-glass liquid-glass--heavy"
      id={bundle.slug}
      data-testid="bundle-card"
      data-bundle-slug={bundle.slug}
      data-has-shopify-product={product ? 'true' : 'false'}
    >
      <div className="bundle-card__badges">
        <span className="bundle-card__badge">−{bundle.discountPercent} %</span>
        {highlighted && (
          <span className="bundle-card__badge bundle-card__badge--highlight">
            {t('bundle.ui.recommended')}
          </span>
        )}
      </div>

      {imageSrc ? (
        <div className="bundle-card__media">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            quality={75}
            className="bundle-card__image"
          />
        </div>
      ) : (
        <div className="bundle-card__icon" aria-hidden="true">
          <CategoryIcon size={22} strokeWidth={1.75} />
        </div>
      )}

      <h3 className="bundle-card__title">{name}</h3>
      <p className="bundle-card__benefit">{benefit}</p>
      <ul className="bundle-card__items">
        {bundle.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {disclaimer && (
        <p className="text-xs text-(--color-text-muted) mb-3 italic">{disclaimer}</p>
      )}
      <div className="bundle-card__footer">
        <span className="bundle-card__category">{categoryLabel}</span>
        {hasShopifyPrice ? (
          <span className="text-sm font-bold text-(--color-primary)" data-testid="bundle-price">
            {hasDiscount && (
              <span className="text-(--color-text-muted) line-through font-normal mr-1.5">
                {compareAt!.amount} €
              </span>
            )}
            {price!.amount} €
          </span>
        ) : (
          <span className="bundle-card__soon">{t('bundle.ui.comingSoon')}</span>
        )}
      </div>

      {product && variant ? (
        <BundleAddToCart
          variantId={variant.id}
          availableForSale={product.availableForSale && variant.availableForSale}
          productUrl={getProductUrl(product.handle)}
        />
      ) : null}
    </article>
  )
}
