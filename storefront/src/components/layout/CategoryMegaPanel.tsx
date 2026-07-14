'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { MegaMenuCategory } from '@/components/layout/HeaderMegaMenu'
import { getMegaMenuBannerSrc } from '@/lib/mega-menu-banners'
import { getProductUrl } from '@/lib/utils'
import { Price } from '@/components/ui/Price'

interface CategoryMegaPanelProps {
  categories: MegaMenuCategory[]
  activeHandle: string
  onCategoryHover: (handle: string) => void
  onNavigate: () => void
}

export default function CategoryMegaPanel({
  categories,
  activeHandle,
  onCategoryHover,
  onNavigate,
}: CategoryMegaPanelProps) {
  const active =
    categories.find((c) => c.handle === activeHandle) ?? categories[0] ?? null

  if (!active) {
    return (
      <p className="py-8 text-sm text-(--color-text-muted)">
        Kategórie sa načítavajú…
      </p>
    )
  }

  const productLabel =
    active.productCount === 1
      ? '1 produkt'
      : active.productCount < 5
        ? `${active.productCount} produkty`
        : `${active.productCount} produktov`

  const bannerSrc = getMegaMenuBannerSrc(active.handle)

  return (
    <div className="mega-menu-grid">
      <nav
        className="mega-menu-list mega-menu-list--scroll"
        aria-label="Kategórie produktov"
      >
        <ul className="space-y-0.5">
          {categories.map((cat) => {
            const isActive = cat.handle === active.handle
            return (
              <li key={cat.handle}>
                <Link
                  href={cat.href}
                  className={`mega-menu-list-item ${isActive ? 'mega-category-active' : ''}`}
                  onMouseEnter={() => onCategoryHover(cat.handle)}
                  onFocus={() => onCategoryHover(cat.handle)}
                  onClick={onNavigate}
                >
                  {cat.icon && (
                    <span className="mega-menu-list-icon" aria-hidden="true">
                      {cat.icon}
                    </span>
                  )}
                  <span className="mega-menu-list-label">{cat.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <Link
          href="/kolekcie"
          className="mega-menu-all-link"
          onClick={onNavigate}
        >
          Všetky kolekcie →
        </Link>
        <Link
          href="/balicky"
          className="mega-menu-all-link"
          onClick={onNavigate}
        >
          Balíčky zdravia →
        </Link>
      </nav>

      <div
        className={`mega-hero-banner${bannerSrc ? ' mega-hero-banner--has-image' : ''}`}
        data-slug={active.handle}
        key={active.handle}
      >
        {bannerSrc && (
          <Image
            src={bannerSrc}
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="mega-hero-banner-image object-cover"
          />
        )}
        <div className="mega-hero-banner-inner">
          {active.icon && (
            <span className="mega-hero-icon" aria-hidden="true">
              {active.icon}
            </span>
          )}
          <h3 className="mega-hero-title">{active.title}</h3>
          {active.description && (
            <p className="mega-hero-description">{active.description}</p>
          )}
          <p className="mega-hero-count">{productLabel}</p>
          <Link
            href={active.href}
            className="mega-hero-cta"
            onClick={onNavigate}
          >
            Prejsť do kategórie →
          </Link>
        </div>
      </div>

      <aside className="mega-menu-products" aria-label="Top produkty v kategórii">
        <p className="mega-menu-products-heading">Obľúbené v kategórii</p>
        {active.featuredProducts && active.featuredProducts.length > 0 ? (
          <ul className="space-y-3">
            {active.featuredProducts.map((product) => {
              const image = product.featuredImage
              const price =
                product.variants.edges[0]?.node.price ??
                product.priceRange.minVariantPrice
              return (
                <li key={product.id}>
                  <Link
                    href={getProductUrl(product.handle)}
                    className="mega-menu-product-card group"
                    onClick={onNavigate}
                  >
                    <div className="mega-menu-product-thumb">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={image.altText ?? product.title}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="text-lg text-(--color-text-light)">📦</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mega-menu-product-title">{product.title}</p>
                      <Price price={price} size="sm" />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-(--color-text-muted) leading-relaxed">
            Prehliadajte celú ponuku v kategórii {active.title}.
          </p>
        )}
      </aside>
    </div>
  )
}
