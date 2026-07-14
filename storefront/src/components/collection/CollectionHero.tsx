import Image from 'next/image'
import { getMegaMenuBannerSrc } from '@/lib/mega-menu-banners'

interface CollectionHeroProps {
  handle: string
  title: string
  description: string | null
  productCount: number
}

export default function CollectionHero({
  handle,
  title,
  description,
  productCount,
}: CollectionHeroProps) {
  const bannerSrc = getMegaMenuBannerSrc(handle)
  const countLabel =
    productCount === 1
      ? '1 produkt'
      : productCount < 5
        ? `${productCount} produkty`
        : `${productCount} produktov`

  return (
    <header
      className={`collection-hero mb-8 overflow-hidden rounded-xl border border-(--color-border) shadow-sm${bannerSrc ? ' collection-hero--has-banner' : ''}`}
      data-collection-handle={handle}
      data-banner-src={bannerSrc ?? undefined}
    >
      <div className="relative min-h-[220px] sm:min-h-[260px] lg:min-h-[320px]">
        {bannerSrc ? (
          <>
            <Image
              src={bannerSrc}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 1120px, 100vw"
              className="collection-hero-image object-cover"
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, var(--color-primary-light) 0%, #C8EFE0 100%)',
            }}
            aria-hidden="true"
          />
        )}
        <div className={`relative z-10 flex h-full min-h-[220px] flex-col justify-center p-6 sm:min-h-[260px] lg:min-h-[320px] lg:p-10${bannerSrc ? ' collection-hero-copy' : ''}`}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-(--color-primary-dark)">
            {countLabel}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold text-(--color-text) lg:text-5xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--color-text-muted) lg:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  )
}
