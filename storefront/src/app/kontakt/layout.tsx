import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'

export const metadata: Metadata = buildPageMetadata(
  t('page.contact.metaTitle', DEFAULT_LOCALE),
  t('page.contact.metaDescription', DEFAULT_LOCALE),
  '/kontakt',
)

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return children
}
