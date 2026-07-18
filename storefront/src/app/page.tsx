import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
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
import { t } from '@/lib/i18n/translate'
import { getNavCollectionItems } from '@/lib/catalog/nav'
import { getFeaturedProducts } from '@/lib/catalog/products'
import { getHomepageCategories } from '@/lib/category-map'
import { BRAND_COPY } from '@/lib/brand'
import { HERO_IMAGE_SIZES, HERO_LCP_QUALITY, HERO_VIDEO_SRC } from '@/lib/hero-image'
import {
  isStorefrontTheme,
  resolveInitialTheme,
  STORAGE_KEY,
} from '@/lib/theme/storefront-theme'
import type { ProductListItem } from '@/lib/catalog/types'

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

function buildHeroSlides(products: ProductListItem[]): HeroSlide[] {
  return products
    .filter((product) => product.featuredImage?.url)
    .slice(0, 5)
    .map((product) => ({
      id: product.id,
      imageUrl: product.featuredImage!.url,
      alt: product.featuredImage!.altText ?? product.title,
      width: product.featuredImage!.width ?? 1600,
      height: product.featuredImage!.height ?? 900,
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
      getNavCollectionItems(),
    ])
  } catch {
    // Shopify not configured
  }

  const categoriesByHandle = new Map(allCategories.map((c) => [c.handle, c]))
  const categories = getHomepageCategories()
    .map((def) => categoriesByHandle.get(def.slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const cookieStore = await cookies()
  const cookieTheme = cookieStore.get(STORAGE_KEY)?.value
  const ssrTheme = resolveInitialTheme(
    isStorefrontTheme(cookieTheme) ? cookieTheme : null,
  )

  const heroSlides = buildHeroSlides(featuredProducts)
  const lcpSlide = heroSlides[0]

  if (ssrTheme === 'noor') {
    preload(HERO_VIDEO_SRC, { as: 'video', type: 'video/mp4' })
  } else if (lcpSlide?.imageUrl) {
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
