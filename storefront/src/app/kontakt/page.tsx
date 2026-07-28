import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { KontaktForm } from './KontaktForm'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'

export default async function Kontakt() {
  const locale = await getRequestLocale()

  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-5xl mx-auto">
          <BrandPageHeader
            eyebrow={t('page.contact.eyebrow', locale)}
            title={t('page.contact.title', locale)}
            subtitle={t('page.contact.subtitle', locale)}
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-(--shadow-card) border border-(--color-border) flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-(--color-text) mb-8 font-montserrat">
                {t('page.contact.detailsHeading', locale)}
              </h2>

              <ul className="space-y-8">
                <li className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-(--color-accent-green) flex items-center justify-center mr-5 shrink-0 text-xl font-bold">
                    @
                  </div>
                  <div>
                    <strong className="block text-lg mb-1 text-(--color-text)">
                      {t('page.contact.emailLabel', locale)}
                    </strong>
                    <a
                      href={`mailto:${COMPANY.email}`}
                      className="text-(--color-text-muted) hover:text-(--color-primary) transition-colors"
                    >
                      {COMPANY.email}
                    </a>
                    <p className="text-sm text-gray-400 mt-1">{t('page.contact.replyNote', locale)}</p>
                  </div>
                </li>

                {COMPANY.phoneDisplay && COMPANY.phoneTel ? (
                  <li className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-green-100 text-(--color-accent-green) flex items-center justify-center mr-5 shrink-0 text-xl font-bold">
                      ☏
                    </div>
                    <div>
                      <strong className="block text-lg mb-1 text-(--color-text)">
                        {t('page.contact.phoneHeading', locale)}
                      </strong>
                      <a
                        href={`tel:${COMPANY.phoneTel}`}
                        className="text-(--color-text-muted) hover:text-(--color-primary) transition-colors"
                      >
                        {COMPANY.phoneDisplay}
                      </a>
                      <p className="text-sm text-gray-400 mt-1">{t('page.contact.hours', locale)}</p>
                    </div>
                  </li>
                ) : null}

                <li className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-(--color-accent-green) flex items-center justify-center mr-5 shrink-0 text-xl font-bold">
                    🏢
                  </div>
                  <div>
                    <strong className="block text-lg mb-1 text-(--color-text)">
                      {t('page.contact.companyHeading', locale)}
                    </strong>
                    <p className="text-(--color-text-muted) leading-relaxed">
                      {COMPANY.legalName}
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
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <KontaktForm />
          </div>
        </div>
      </Container>
    </div>
  )
}
