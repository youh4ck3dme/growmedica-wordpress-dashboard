import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Reklamačný poriadok', undefined, '/reklamacny-poriadok')

export default function ReklamacnyPoriadok() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title="Reklamačný poriadok" centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">Predávajúci</h2>
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

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">Postup pri reklamácii</h2>
              <p>
                V prípade, že ste s tovarom nespokojní, alebo bol poškodený pri preprave, kontaktujte nás na{' '}
                {COMPANY.email}. V e-maile uveďte číslo objednávky, popis vady a prípadne fotografie.
              </p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">Adresa na vrátenie tovaru</h2>
              <p className="not-prose leading-relaxed">
                {COMPANY.legalName}
                <br />
                {COMPANY.street}
                <br />
                {COMPANY.zip} {COMPANY.city}
                <br />
                {COMPANY.country}
              </p>
              <p>Pred odoslaním tovaru nás prosím kontaktujte e-mailom kvôli potvrdeniu a inštrukciám.</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">Vrátenie tovaru (odstúpenie od zmluvy)</h2>
              <p>
                Spotrebiteľ má právo na vrátenie nepoužitého a nepoškodeného tovaru do 14 dní od prevzatia bez
                udania dôvodu. Tovar zašlite na adresu vyššie spolu s kópiou dokladu o kúpe.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
