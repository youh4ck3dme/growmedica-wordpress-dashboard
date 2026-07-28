import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { t } from '@/lib/i18n/translate'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { getRequestLocale } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: t('page.offline.metaTitle', DEFAULT_LOCALE),
  robots: { index: false, follow: false },
}

export default async function OfflinePage() {
  const locale = await getRequestLocale()

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-xl border border-(--color-border) bg-white p-8 text-center shadow-sm">
        <p className="text-4xl" aria-hidden="true">
          📡
        </p>
        <h1 className="mt-4 text-2xl font-bold text-(--color-text)">
          {t('page.offline.heading', locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
          {t('page.offline.detail', locale)}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn btn-primary">
            {t('page.offline.home', locale)}
          </Link>
          <Link href="/produkty" className="btn btn-secondary">
            {t('nav.products', locale)}
          </Link>
        </div>
      </div>
    </Container>
  )
}
