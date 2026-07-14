import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Doprava a platba')

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
                    <h3 className="text-lg font-bold text-(--color-primary) mb-2">Kuriérska služba</h3>
                    <p className="mb-2">Doručenie priamo k vám domov do 2-3 pracovných dní.</p>
                    <p className="font-bold text-(--color-accent-green)">3,90 €</p>
                  </div>
                  <div className="p-6 border border-(--color-border) rounded-xl bg-gray-50">
                    <h3 className="text-lg font-bold text-(--color-primary) mb-2">Packeta (Zásielkovňa)</h3>
                    <p className="mb-2">Vyzdvihnutie na vami zvolenom výdajnom mieste do 1-2 pracovných dní.</p>
                    <p className="font-bold text-(--color-accent-green)">2,90 €</p>
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
                      <strong className="text-(--color-text) block mb-1">Platba kartou online (Zadarmo)</strong>
                      Bezpečná platba cez bránu s okamžitým potvrdením.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">Dobierka (+ 1,50 €)</strong>
                      Platba v hotovosti alebo kartou priamo kuriérovi alebo na pobočke Packety pri prevzatí.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded bg-(--color-accent-green) text-white flex items-center justify-center mr-4 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-(--color-text) block mb-1">Bankový prevod (Zadarmo)</strong>
                      Objednávku odošleme hneď po prijatí platby na náš účet.
                    </div>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
