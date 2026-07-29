import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'
import { BRAND_COPY } from '@/lib/brand'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const title = t('wishlist.metaTitle', locale)
  return {
    title,
    description: t('wishlist.metaDescription', locale),
    openGraph: {
      title: `${title} | ${BRAND_COPY.siteName}`,
      description: t('wishlist.metaDescription', locale),
    },
  }
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
