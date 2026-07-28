import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { buildPageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/server'

export const metadata: Metadata = buildPageMetadata(
  t('page.privacy.title', DEFAULT_LOCALE),
  undefined,
  '/ochrana-osobnych-udajov',
)

export default async function GDPR() {
  const locale = await getRequestLocale()

  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title={t('page.privacy.title', locale)} centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.privacy.s1h', locale)}
              </h2>
              <p>{t('page.privacy.s1p', locale)}</p>
              <p className="not-prose leading-relaxed">
                <strong className="text-(--color-text)">{COMPANY.legalName}</strong>
                <br />
                {COMPANY.street}
                <br />
                {COMPANY.zip} {COMPANY.city}
                <br />
                {COMPANY.country}
                <br />
                IČO: {COMPANY.ico}
                <br />
                DIČ: {COMPANY.dic}
                <br />
                E-mail:{' '}
                <a href={`mailto:${COMPANY.email}`} className="text-(--color-primary) hover:underline">
                  {COMPANY.email}
                </a>
              </p>
              <p>{t('page.privacy.s1note', locale)}</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.privacy.s2h', locale)}
              </h2>
              <p>{t('page.privacy.s2p', locale)}</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.privacy.s3h', locale)}
              </h2>
              <p>{t('page.privacy.s3p', locale, { email: COMPANY.email })}</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
