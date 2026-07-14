import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { FaqList } from '@/components/faq/FaqList'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata('Často kladené otázky')

const faqs = [
  {
    q: 'Aké sú čakacie doby na doručenie?',
    a: 'Objednávky expedujeme väčšinou do 24 hodín. Štandardná doba doručenia v rámci Slovenska je 1 až 3 pracovné dni.',
  },
  {
    q: 'Je možné si tovar vyzdvihnúť aj osobne?',
    a: 'Osobný odber v našom sídle momentálne neposkytujeme. Ponúkame však širokú sieť odberných miest Packeta.',
  },
  {
    q: 'Sú vaše výživové doplnky vhodné aj pre vegánov?',
    a: 'Väčšina našich produktov je na rastlinnej báze a vhodná pre vegánov. Presné informácie nájdete vždy v zložení konkrétneho produktu.',
  },
  {
    q: 'Ako mám reklamovať poškodený tovar?',
    a: 'Ak Vám dorazil tovar poškodený, prosím odfoťte ho a pošlite nám fotografie na info@growmedica.sk. Vyriešime to v čo najkratšom čase zaslaním nového kusu.',
  },
]

export default function FAQ() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto">
          <BrandPageHeader
            eyebrow="Pomoc a podpora"
            title="Často kladené otázky (FAQ)"
          />

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-(--shadow-card) border border-(--color-border)">
            <FaqList items={faqs} />

            <div className="mt-12 text-center pt-8 border-t border-(--color-border)">
              <p className="text-(--color-text-muted) mb-4">Nenašli ste odpoveď na svoju otázku?</p>
              <a href="/kontakt" className="btn btn-primary inline-flex">
                Kontaktujte nás
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
