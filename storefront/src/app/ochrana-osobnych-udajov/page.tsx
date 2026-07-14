import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Ochrana osobných údajov')

export default function GDPR() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title="Ochrana osobných údajov (GDPR)" centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <p className="italic bg-gray-50 p-4 rounded-lg">
                Poznámka: Tu vložte znenie o spracúvaní osobných údajov.
              </p>
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">1. Správca údajov</h2>
              <p>GrowMedica s.r.o., BELLOVA 6, KOŠICE, 040 01 dbá na bezpečnosť vašich osobných údajov.</p>
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">2. Aké údaje spracúvame a prečo</h2>
              <p>
                Spracúvame len tie údaje, ktoré sú nutné na vybavenie vašej objednávky (meno, adresa, e-mail,
                telefónne číslo) alebo na odoslanie noviniek, ak ste nám na to dali súhlas.
              </p>
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">3. Vaše práva</h2>
              <p>
                Máte právo na výmaz, zmenu alebo informácie o tom, aké údaje o vás vedieme. Stačí nás kontaktovať
                na info@growmedica.sk.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
