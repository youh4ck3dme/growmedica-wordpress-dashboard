import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Obchodné podmienky', undefined, '/obchodne-podmienky')

export default function ObchodnePodmienky() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader title="Obchodné podmienky" centered={false} className="mb-8" />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">1. Predávajúci</h2>
              <p>Tieto obchodné podmienky upravujú vzájomné práva a povinnosti medzi predávajúcim a kupujúcim pri nákupe tovaru v e-shope {COMPANY.website.replace('https://', '')}.</p>
              <p className="not-prose leading-relaxed">
                <strong className="text-(--color-text)">Predávajúci (dodávateľ):</strong>
                <br />
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
                <br />
                E-mail:{' '}
                <a href={`mailto:${COMPANY.email}`} className="text-(--color-primary) hover:underline">
                  {COMPANY.email}
                </a>
              </p>
              <p className="not-prose leading-relaxed">
                <strong className="text-(--color-text)">Bankové spojenie:</strong>
                <br />
                IBAN: {COMPANY.iban}
                <br />
                BIC / SWIFT: {COMPANY.bic}
                <br />
                Banka: {COMPANY.bankName}
              </p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">2. Uzavretie kúpnej zmluvy</h2>
              <p>
                Zmluva je uzavretá potvrdením objednávky zo strany predávajúceho (e-mailom). Kupujúci (odberateľ)
                je povinný uviesť pri objednávke správne a úplné kontaktné a doručovacie údaje.
              </p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">3. Cena a platba</h2>
              <p>
                Predávajúci nie je platcom DPH; ceny sú uvedené bez DPH, ak nie je uvedené inak. Platba je možná
                kartou online, bankovým prevodom na účet predávajúceho, dobierkou alebo inými spôsobmi uvedenými
                v pokladni.
              </p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">4. Dodanie tovaru</h2>
              <p>
                Tovar dodávame na adresu alebo výdajné miesto uvedené kupujúcim. Bližšie podmienky dopravy sú na
                stránke Doprava a platba.
              </p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">5. Odstúpenie od zmluvy a reklamácie</h2>
              <p>
                Spotrebiteľ môže odstúpiť od zmluvy bez udania dôvodu v lehote 14 dní od prevzatia tovaru.
                Podrobnosti upravuje Reklamačný poriadok.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
