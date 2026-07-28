import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { buildPageMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

export const metadata: Metadata = buildPageMetadata(
  t('page.blog.metaTitle', DEFAULT_LOCALE),
  t('page.blog.metaDescription', DEFAULT_LOCALE),
  '/blog',
)

export default async function BlogPage() {
  const locale = await getRequestLocale()

  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader
            eyebrow={t('page.blog.eyebrow', locale)}
            title={t('page.blog.title', locale)}
            subtitle={t('page.blog.subtitle', locale)}
          />

          <div className="bg-white p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border) text-center">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-(--color-primary) mb-4 font-montserrat">
              {t('page.blog.comingSoon', locale)}
            </h2>
            <p className="text-(--color-text-muted) mb-8 max-w-md mx-auto">
              {t('page.blog.empty', locale)}
            </p>
            <Link href="/produkty" className="btn btn-primary btn-lg">
              {t('page.blog.cta', locale)}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
