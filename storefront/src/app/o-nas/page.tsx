import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { BRAND_COPY } from '@/lib/brand'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata(
  'O nás',
  BRAND_COPY.pageDescriptions.about,
)

export default function AboutPage() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg)">
      <Container>
        <div className="max-w-3xl mx-auto">
          <BrandPageHeader
            eyebrow="Náš príbeh"
            title={BRAND_COPY.aboutPageTitle}
            subtitle={BRAND_COPY.aboutPageIntro}
          />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <h2 className="text-2xl font-bold text-(--color-primary) mb-4 font-montserrat">Naše poslanie</h2>
            <p className="text-(--color-text-muted) mb-6 leading-relaxed">
              V {BRAND_COPY.companyName} je našou hlavnou prioritou prinášať na trh prirodzené biomedicínske
              supplementy, ktoré reálne pomáhajú. Netvoríme len ďalšie doplnky výživy — vytvárame funkčné,
              čisté a vysoko vstrebateľné produkty pre zákazníkov v strednej Európe.
            </p>

            <h2 className="text-2xl font-bold text-(--color-primary) mb-4 font-montserrat mt-10">Prečo my?</h2>
            <ul className="space-y-4 text-(--color-text-muted) mb-8">
              <li className="flex items-start">
                <span className="text-(--color-accent-green) font-bold mr-3 text-lg">✓</span>
                <span>
                  <strong className="text-(--color-text)">Prémiová kvalita:</strong> Vyberáme iba tie
                  najčistejšie suroviny z overených zdrojov, aby sme zabezpečili maximálnu účinnosť.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-(--color-accent-green) font-bold mr-3 text-lg">✓</span>
                <span>
                  <strong className="text-(--color-text)">Vedecký prístup:</strong> Každý produkt je
                  starostlivo zostavený na základe aktuálnych vedeckých poznatkov a výskumov.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-(--color-accent-green) font-bold mr-3 text-lg">✓</span>
                <span>
                  <strong className="text-(--color-text)">Transparentnosť:</strong> Žiadne skryté zložky,
                  žiadne zbytočné plnivá — len čistá účinná látka, ktorú vaše telo naozaj využije.
                </span>
              </li>
            </ul>

            <div className="bg-(--color-surface-2) rounded-xl p-6 md:p-8 border-l-4 border-(--color-accent-green) my-10">
              <p className="italic text-(--color-text) font-medium text-lg">
                „Zdravie nie je samozrejmosť, je to celoživotná investícia. My v {BRAND_COPY.companyName} vám
                dávame do rúk tie najlepšie nástroje, aby bola táto investícia úspešná.“
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-(--color-border) text-center">
              <h3 className="text-xl font-bold text-(--color-primary) mb-5 font-montserrat">
                Presvedčte sa sami na vlastnom tele
              </h3>
              <Link href="/produkty" className="btn btn-primary btn-lg">
                Prezrieť si naše produkty
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
