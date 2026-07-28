import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { buildPageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/server'

export const metadata: Metadata = buildPageMetadata(
  t('page.shipping.title', DEFAULT_LOCALE),
  undefined,
  '/doprava-a-platba',
)

export default async function DopravaPlatba() {
  const locale = await getRequestLocale()
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title={t('page.shipping.title', locale)} centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="space-y-12 text-(--color-text-muted)">
              <section>
                <h2 className="text-2xl font-bold text-(--color-text) mb-6">
                  {t('page.shipping.deliveryHeading', locale)}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-6 border border-(--color-border) rounded-xl bg-gray-50">
                    <h3 className="text-lg font-bold text-(--color-primary) mb-2">
                      {t('page.shipping.dpdTitle', locale)}
                    </h3>
                    <p className="mb-2">{t('page.shipping.dpdBody', locale)}</p>
                    <p className="font-bold text-(--color-accent-green)">
                      {t('page.shipping.dpdPrice', locale)}
                    </p>
                  </div>
                  <div className="p-6 border border-(--color-border) rounded-xl bg-gray-50">
                    <h3 className="text-lg font-bold text-(--color-primary) mb-2">
                      {t('page.shipping.packetaTitle', locale)}
                    </h3>
                    <p className="mb-2">{t('page.shipping.packetaBody', locale)}</p>
                    <p className="font-bold text-(--color-accent-green)">
                      {t('page.shipping.packetaPrice', locale)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm bg-green-50 text-green-800 p-3 rounded-lg">
                  {t('page.shipping.freeNote', locale)}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-(--color-text) mb-6">
                  {t('page.shipping.paymentHeading', locale)}
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">
                        {t('page.shipping.cardTitle', locale)}
                      </strong>
                      {t('page.shipping.cardBody', locale)}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">
                        {t('page.shipping.codTitle', locale)}
                      </strong>
                      {t('page.shipping.codBody', locale)}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">
                        {t('page.shipping.transferTitle', locale)}
                      </strong>
                      <p className="mb-2">{t('page.shipping.transferBody', locale)}</p>
                      <div className="text-sm bg-gray-50 border border-(--color-border) rounded-lg p-4 leading-relaxed text-(--color-text)">
                        <strong>{COMPANY.legalName}</strong>
                        <br />
                        IBAN: {COMPANY.iban}
                        <br />
                        BIC / SWIFT: {COMPANY.bic}
                        <br />
                        Banka: {COMPANY.bankName}
                        <br />
                        {t('page.shipping.transferNote', locale)}
                      </div>
                    </div>
                  </li>
                </ul>
              </section>

              <section className="text-sm border-t border-(--color-border) pt-6">
                <p>
                  <strong className="text-(--color-text)">{t('page.shipping.supplier', locale)}</strong>{' '}
                  {COMPANY.legalName}, {COMPANY.street}, {COMPANY.zip} {COMPANY.city}, IČO:{' '}
                  {COMPANY.ico}, DIČ: {COMPANY.dic}
                </p>
              </section>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
