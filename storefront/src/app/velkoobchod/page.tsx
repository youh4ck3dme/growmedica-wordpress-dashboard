import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { buildPageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/server'

export const metadata: Metadata = buildPageMetadata(
  t('page.wholesale.metaTitle', DEFAULT_LOCALE),
  undefined,
  '/velkoobchod',
)

export default async function Velkoobchod() {
  const locale = await getRequestLocale()

  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader
            eyebrow={t('page.wholesale.eyebrow', locale)}
            title={t('page.wholesale.title', locale)}
          />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <p className="text-lg">{t('page.wholesale.intro', locale)}</p>
              <p>{t('page.wholesale.intro2', locale)}</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">
                {t('page.wholesale.offerHeading', locale)}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('page.wholesale.offer1', locale)}</li>
                <li>{t('page.wholesale.offer2', locale)}</li>
                <li>{t('page.wholesale.offer3', locale)}</li>
                <li>{t('page.wholesale.offer4', locale)}</li>
              </ul>

              <div className="mt-10 p-6 bg-(--color-surface-2) rounded-xl border border-(--color-border)">
                <h2 className="text-xl font-bold text-(--color-text) mb-3">
                  {t('page.wholesale.contactHeading', locale)}
                </h2>
                <p>
                  {t('page.wholesale.emailLabel', locale)}{' '}
                  <a href="mailto:velkoobchod@growmedica.cz" className="text-(--color-primary) font-bold">
                    velkoobchod@growmedica.cz
                  </a>
                  <br />
                  {t('page.wholesale.phoneLabel', locale)} +421 900 000 001
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
