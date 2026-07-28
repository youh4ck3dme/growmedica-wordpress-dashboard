import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { buildPageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/server'

export const metadata: Metadata = buildPageMetadata(
  t('page.returns.title', DEFAULT_LOCALE),
  undefined,
  '/reklamacny-poriadok',
)

export default async function ReklamacnyPoriadok() {
  const locale = await getRequestLocale()

  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title={t('page.returns.title', locale)} centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.returns.sellerH', locale)}
              </h2>
              <p className="not-prose leading-relaxed">
                {COMPANY.legalName}
                <br />
                {COMPANY.street}
                <br />
                {COMPANY.zip} {COMPANY.city}
                <br />
                {COMPANY.country}
                <br />
                IČO: {COMPANY.ico} · DIČ: {COMPANY.dic}
                <br />
                E-mail:{' '}
                <a href={`mailto:${COMPANY.email}`} className="text-(--color-primary) hover:underline">
                  {COMPANY.email}
                </a>
              </p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.returns.processH', locale)}
              </h2>
              <p>{t('page.returns.processP', locale, { email: COMPANY.email })}</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.returns.addressH', locale)}
              </h2>
              <p className="not-prose leading-relaxed">
                {COMPANY.legalName}
                <br />
                {COMPANY.street}
                <br />
                {COMPANY.zip} {COMPANY.city}
                <br />
                {COMPANY.country}
              </p>
              <p>{t('page.returns.contactBefore', locale)}</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.returns.withdrawH', locale)}
              </h2>
              <p>{t('page.returns.withdrawP', locale)}</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
