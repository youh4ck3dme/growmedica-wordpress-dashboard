import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import { BRAND_COPY } from '@/lib/brand'

export const metadata: Metadata = buildPageMetadata(
  'Kontakt',
  BRAND_COPY.pageDescriptions.contact,
)

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return children
}
