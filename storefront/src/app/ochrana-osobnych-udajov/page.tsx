import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Ochrana osobných údajov', undefined, '/ochrana-osobnych-udajov')

export default function GDPR() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title="Ochrana osobných údajov (GDPR)" centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">1. Prevádzkovateľ / správca údajov</h2>
              <p>
                Prevádzkovateľom osobných údajov je:
              </p>
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
              <p>Dbáme na bezpečnosť vašich osobných údajov v súlade s GDPR a platnými predpismi SR.</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">2. Aké údaje spracúvame a prečo</h2>
              <p>
                Spracúvame len tie údaje, ktoré sú nutné na vybavenie vašej objednávky (meno, adresa, e-mail,
                telefónne číslo) alebo na odoslanie noviniek, ak ste nám na to dali súhlas.
              </p>
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">3. Vaše práva</h2>
              <p>
                Máte právo na výmaz, zmenu alebo informácie o tom, aké údaje o vás vedieme. Stačí nás kontaktovať
                na {COMPANY.email}.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
