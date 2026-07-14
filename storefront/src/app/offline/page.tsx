import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Bez pripojenia',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-xl border border-(--color-border) bg-white p-8 text-center shadow-sm">
        <p className="text-4xl" aria-hidden="true">
          📡
        </p>
        <h1 className="mt-4 text-2xl font-bold text-(--color-text)">Bez pripojenia k internetu</h1>
        <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
          Vyzerá to, že nemáte pripojenie. Skúste sa znovu pripojiť a obnovte stránku, alebo
          prejdite na domovskú stránku.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn btn-primary">
            Domov
          </Link>
          <Link href="/produkty" className="btn btn-secondary">
            Produkty
          </Link>
        </div>
      </div>
    </Container>
  )
}
