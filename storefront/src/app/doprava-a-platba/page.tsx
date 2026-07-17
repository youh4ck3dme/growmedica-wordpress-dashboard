import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Doprava a platba', undefined, '/doprava-a-platba')

export default function DopravaPlatba() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title="Doprava a platba" centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="space-y-12 text-(--color-text-muted)">
              <section>
                <h2 className="text-2xl font-bold text-(--color-text) mb-6">Možnosti dopravy</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-6 border border-(--color-border) rounded-xl bg-gray-50">
                    <h3 className="text-lg font-bold text-(--color-primary) mb-2">Kuriérska služba (DPD)</h3>
                    <p className="mb-2">Doručenie priamo k vám domov do 2–3 pracovných dní.</p>
                    <p className="font-bold text-(--color-accent-green)">od 3,90 €</p>
                  </div>
                  <div className="p-6 border border-(--color-border) rounded-xl bg-gray-50">
                    <h3 className="text-lg font-bold text-(--color-primary) mb-2">Packeta (Zásielkovňa)</h3>
                    <p className="mb-2">Vyzdvihnutie na vami zvolenom výdajnom mieste do 1–2 pracovných dní.</p>
                    <p className="font-bold text-(--color-accent-green)">od 2,90 €</p>
                  </div>
                </div>
                <p className="mt-4 text-sm bg-green-50 text-green-800 p-3 rounded-lg">
                  Pri nákupe nad 50 € máte akúkoľvek dopravu úplne ZADARMO!
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-(--color-text) mb-6">Možnosti platby</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">Platba kartou online (zadarmo)</strong>
                      Bezpečná platba kartou / Google Pay / Apple Pay s okamžitým potvrdením.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">Dobierka (+ 3,00 €)</strong>
                      Platba v hotovosti alebo kartou priamo kuriérovi alebo na pobočke Packety pri prevzatí.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">Bankový prevod (zadarmo)</strong>
                      <p className="mb-2">
                        Objednávku odošleme hneď po prijatí platby na účet dodávateľa:
                      </p>
                      <div className="text-sm bg-gray-50 border border-(--color-border) rounded-lg p-4 leading-relaxed text-(--color-text)">
                        <strong>{COMPANY.legalName}</strong>
                        <br />
                        IBAN: {COMPANY.iban}
                        <br />
                        BIC / SWIFT: {COMPANY.bic}
                        <br />
                        Banka: {COMPANY.bankName}
                        <br />
                        Do poznámky uveďte číslo objednávky.
                      </div>
                    </div>
                  </li>
                </ul>
              </section>

              <section className="text-sm border-t border-(--color-border) pt-6">
                <p>
                  <strong className="text-(--color-text)">Dodávateľ:</strong> {COMPANY.legalName},{' '}
                  {COMPANY.street}, {COMPANY.zip} {COMPANY.city}, IČO: {COMPANY.ico}, DIČ: {COMPANY.dic}
                </p>
              </section>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
