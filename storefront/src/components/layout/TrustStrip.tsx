'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { BRAND_COPY } from '@/lib/brand'

export default function TrustStrip() {
  const pathname = usePathname()

  if (pathname === '/') {
    return null
  }

  return (
    <div className="trust-strip" role="region" aria-label="O značke GrowMedica.sk">
      <Container>
        <div className="trust-strip-inner">
          <p className="trust-strip-tagline">{BRAND_COPY.tagline}</p>
          <div className="trust-strip-stats" aria-hidden="true">
            {BRAND_COPY.trustStripStats.map((stat) => (
              <span key={stat} className="trust-strip-stat">
                {stat}
              </span>
            ))}
          </div>
          <Link href="/o-nas" className="trust-strip-link">
            O nás →
          </Link>
        </div>
      </Container>
    </div>
  )
}
