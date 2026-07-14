import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { FaqList } from '@/components/faq/FaqList'
import { buildPageMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/i18n/server'
import { getFaqItems, t } from '@/lib/i18n/translate'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return buildPageMetadata(t('faq.title', locale))
}

export default async function FAQ() {
  const locale = await getRequestLocale()
  const faqs = getFaqItems(locale)

  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto">
          <BrandPageHeader
            eyebrow={t('faq.eyebrow', locale)}
            title={t('faq.title', locale)}
          />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <FaqList items={faqs} />

            <div className="mt-12 text-center pt-8 border-t border-(--color-border)">
              <p className="text-(--color-text-muted) mb-4">{t('faq.contactPrompt', locale)}</p>
              <a href="/kontakt" className="btn btn-primary inline-flex">
                {t('faq.contactCta', locale)}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
