import { Container } from '@/components/ui/Container'
import BrandPageHeader from '@/components/ui/BrandPageHeader'
import { COMPANY } from '@/lib/company'
import { KontaktForm } from './KontaktForm'

export default function Kontakt() {
  return (
    <div className="py-12 lg:py-20 bg-(--color-bg) min-h-screen">
      <Container>
        <div className="max-w-5xl mx-auto">
          <BrandPageHeader
            eyebrow="Sme tu pre vás"
            title="Kontaktujte nás"
            subtitle="Máte otázky ohľadom produktov, vašej objednávky, alebo hľadáte odbornú radu? Neváhajte nám napísať alebo zavolať."
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-(--shadow-card) border border-(--color-border) flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-(--color-text) mb-8 font-montserrat">Kontaktné údaje</h2>

              <ul className="space-y-8">
                <li className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-(--color-accent-green) flex items-center justify-center mr-5 shrink-0 text-xl font-bold">
                    @
                  </div>
                  <div>
                    <strong className="block text-lg mb-1 text-(--color-text)">E-mail:</strong>
                    <a
                      href={`mailto:${COMPANY.email}`}
                      className="text-(--color-text-muted) hover:text-(--color-primary) transition-colors"
                    >
                      {COMPANY.email}
                    </a>
                    <p className="text-sm text-gray-400 mt-1">Odpovedáme väčšinou do 24 hodín.</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-(--color-accent-green) flex items-center justify-center mr-5 shrink-0 text-xl font-bold">
                    ☏
                  </div>
                  <div>
                    <strong className="block text-lg mb-1 text-(--color-text)">Zákaznícka linka:</strong>
                    <a
                      href={`tel:${COMPANY.phoneTel}`}
                      className="text-(--color-text-muted) hover:text-(--color-primary) transition-colors"
                    >
                      {COMPANY.phoneDisplay}
                    </a>
                    <p className="text-sm text-gray-400 mt-1">Po - Pia: 9:00 - 16:00</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-(--color-accent-green) flex items-center justify-center mr-5 shrink-0 text-xl font-bold">
                    🏢
                  </div>
                  <div>
                    <strong className="block text-lg mb-1 text-(--color-text)">
                      Sídlo spoločnosti a fakturačné údaje:
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
