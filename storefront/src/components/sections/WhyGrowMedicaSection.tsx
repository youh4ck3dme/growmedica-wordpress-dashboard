import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { BRAND_COPY } from '@/lib/brand'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WhyGrowMedicaSection() {
  return (
    <section
      className="why-growmedica noor-reveal theme-transition"
      aria-label="O GrowMedica.sk"
    >
      <Container>
        <div className="why-growmedica__glass liquid-glass liquid-glass--heavy">
          <p className="why-growmedica__label">{BRAND_COPY.aboutLabel}</p>
          <h2 className="why-gm-display why-growmedica__heading">{BRAND_COPY.aboutHeading}</h2>
          <p className="why-gm-display why-growmedica__slogan">{BRAND_COPY.aboutSlogan}</p>
          <p className="why-growmedica__body">{BRAND_COPY.aboutBody}</p>

          <ul className="why-growmedica__health-grid" aria-label="Prečo si vybrať GrowMedica">
            {BRAND_COPY.aboutHealthLines.map((line) => (
              <li key={line} className="why-growmedica__health-line">
                <CheckIcon />
                {line}
              </li>
            ))}
          </ul>

          <div className="why-growmedica__actions">
            <Link href="/balicky" className="btn btn-primary">
              {BRAND_COPY.bundlesCta}
            </Link>
            <Link href="/o-nas" className="btn btn-ghost">
              Viac o nás
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
