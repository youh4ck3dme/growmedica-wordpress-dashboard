import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { getImageProps } from 'next/image'
import { preload } from 'react-dom'
import { Container } from '@/components/ui/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { HeroSlider, type HeroSlide } from '@/components/sections/HeroSlider'
import { TrustBadges } from '@/components/sections/TrustBadges'
import { ScrollRevealSection } from '@/components/sections/ScrollRevealSection'
import { WhyGrowMedicaSection } from '@/components/sections/WhyGrowMedicaSection'
import { BundleShowcase } from '@/components/sections/BundleShowcase'
import { HomeMobileSearch } from '@/components/home/HomeMobileSearch'
import { HomeCategoriesSection, HomeFeaturedSection } from '@/components/home/HomeSections'
import { getRequestLocale } from '@/lib/i18n/server'
import { t, type TranslationKey } from '@/lib/i18n/translate'
import type { Locale } from '@/lib/i18n/types'
import { getNavCollectionItems } from '@/lib/catalog/nav'
import { shouldIncludeMegaMenuCollection } from '@/lib/catalog/nav-types'
import { getFeaturedProducts } from '@/lib/catalog/products'
import { BRAND_COPY } from '@/lib/brand'
import { HERO_IMAGE_SIZES, HERO_LCP_QUALITY } from '@/lib/hero-image'
import { HERO_SLIDES } from '@/lib/hero-slides'

const SupplementFinder = dynamic(
  () =>
    import('@/components/ai/SupplementFinder').then((mod) => ({
      default: mod.SupplementFinder,
    })),
  {
    loading: () => <div className="min-h-48" aria-hidden="true" />,
  },
)

const CategoryGrid = dynamic(
  () =>
    import('@/components/collection/CategoryGrid').then((mod) => ({
      default: mod.CategoryGrid,
    })),
  {
    loading: () => <div className="min-h-40" aria-hidden="true" />,
  },
)

export const revalidate = 3600

export const metadata: Metadata = {
  title: BRAND_COPY.siteTitle,
  description: BRAND_COPY.siteDescription,
}

function buildHeroSlides(locale: Locale): HeroSlide[] {
  return HERO_SLIDES.map((slide) => ({
    id: slide.id,
    imageUrl: slide.imageUrl,
    alt: t(`hero.slides.${slide.copyKey}.alt` as TranslationKey, locale),
    width: slide.width,
    height: slide.height,
    copyKey: slide.copyKey,
    ctaHref: slide.ctaHref,
  }))
}

function preloadHeroLcpImage(slide: HeroSlide): void {
  const {
    props: { src, srcSet, sizes },
  } = getImageProps({
    alt: slide.alt,
    src: slide.imageUrl,
    fill: true,
    sizes: HERO_IMAGE_SIZES,
    quality: HERO_LCP_QUALITY,
    priority: true,
  })

  preload(src, {
    as: 'image',
    imageSrcSet: srcSet,
    imageSizes: sizes,
    fetchPriority: 'high',
  })
}

export default async function HomePage() {
  const locale = await getRequestLocale()
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = []
  let allCategories: Awaited<ReturnType<typeof getNavCollectionItems>> = []
  try {
    ;[featuredProducts, allCategories] = await Promise.all([
      getFeaturedProducts(8),
      getNavCollectionItems(locale),
    ])
  } catch {
    // Shopify not configured
  }

  // Same top-level tree as header mega menu + footer Menu
  const categories = allCategories.filter(shouldIncludeMegaMenuCollection)

  const heroSlides = buildHeroSlides(locale)
  const lcpSlide = heroSlides[0]

  if (lcpSlide?.imageUrl) {
    preloadHeroLcpImage(lcpSlide)
  }

  return (
    <div>
      <HomeMobileSearch />

      <HeroSlider slides={heroSlides} />

      <ScrollRevealSection>
        <TrustBadges />
      </ScrollRevealSection>

      <ScrollRevealSection as="div">
        <HomeCategoriesSection>
          <CategoryGrid categories={categories} />
        </HomeCategoriesSection>
      </ScrollRevealSection>

      <div className="noor-reveal noor-glass theme-transition bg-(--color-surface) border-y border-(--color-border)">
        <Container>
          <SupplementFinder />
        </Container>
      </div>

      <HomeFeaturedSection>
        <ProductGrid
          products={featuredProducts}
          emptyTitle={t('empty.products.title', locale)}
          emptyDescription={t('empty.products.description', locale)}
          emptyAction={t('empty.products.action', locale)}
        />
      </HomeFeaturedSection>

      <WhyGrowMedicaSection />

      <ScrollRevealSection
        as="section"
        className="theme-transition py-12 lg:py-16 bg-(--color-surface-2)"
        aria-labelledby="bundles-heading"
      >
        <Container>
          <BundleShowcase />
        </Container>
      </ScrollRevealSection>
    </div>
  )
}
