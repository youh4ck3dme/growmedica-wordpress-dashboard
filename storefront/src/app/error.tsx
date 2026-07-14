'use声明 client' // Wait, standard next.js directive is 'use client'
'use client'

import Link from 'next/link'

import { useEffect } from 'react'
import { Container } from '@/components/ui/Container'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="py-20 bg-(--color-surface-2) min-h-[60vh] flex items-center">
      <Container>
        <div className="flex flex-col items-center justify-center text-center px-4">
          <div className="mb-6">
            <svg className="h-16 w-16 text-(--color-error)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-(--color-text) mb-2">
            Niečo sa pokazilo
          </h2>
          <p className="text-(--color-text-muted) max-w-md mb-6 leading-relaxed">
            Pri načítavaní tejto stránky sa vyskytla neočakávaná chyba. Naši technici už pracujú na náprave.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="btn btn-primary"
            >
              Skúsiť znova
            </button>
            <Link href="/" className="btn btn-secondary">
              Domov
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
