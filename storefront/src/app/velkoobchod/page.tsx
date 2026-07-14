import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { BRAND_COPY } from '@/lib/brand'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Veľkoobchod')

export default function Velkoobchod() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BrandPageHeader
            eyebrow="B2B spolupráca"
            title="Kontakt a veľkoobchodná spolupráca"
          />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <div className="prose prose-lg text-(--color-text-muted) space-y-6">
              <p className="text-lg">
                Ste lekáreň, fitness centrum, bio obchod alebo terapeut a radi by ste zaradili biomedicínske
                supplementy {BRAND_COPY.companyName} do svojej ponuky?
              </p>
              <p>Hľadáme stabilných partnerov, ktorým záleží na kvalite a zdraví ich zákazníkov tak ako nám.</p>

              <h2 className="text-xl font-bold text-(--color-text) mt-8 mb-4">Čo ponúkame B2B partnerom?</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Výhodné veľkoobchodné zľavy a marže</li>
                <li>Prémiovú a garantovanú kvalitu produktov</li>
                <li>Marketingovú a informačnú podporu</li>
                <li>Rýchle dodanie zo slovenského skladu</li>
              </ul>

              <div className="mt-10 p-6 bg-(--color-surface-2) rounded-xl border border-(--color-border)">
                <h2 className="text-xl font-bold text-(--color-text) mb-3">Kontakt pre veľkoobchod</h2>
                <p>
                  E-mail:{' '}
                  <a href="mailto:velkoobchod@growmedica.sk" className="text-(--color-primary) font-bold">
                    velkoobchod@growmedica.sk
                  </a>
                  <br />
                  Telefón: +421 900 000 001
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
