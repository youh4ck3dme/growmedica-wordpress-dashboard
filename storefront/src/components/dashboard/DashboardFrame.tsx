'use client'

import { useEffect, useState } from 'react'

const IFRAME_LOAD_TIMEOUT_MS = 15_000

type DashboardFrameProps = {
  src: string
  title?: string
}

export default function DashboardFrame({
  src,
  title = 'GrowMedica Dashboard',
}: DashboardFrameProps) {
  const [loadError, setLoadError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading((loading) => {
        if (loading) setLoadError(true)
        return false
      })
    }, IFRAME_LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [src])

  if (loadError) {
    return (
      <div
        className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-(--color-surface) px-6 text-center"
        data-testid="dashboard-frame-error"
      >
        <p className="text-lg font-semibold text-(--color-text)">
          WordPress admin sa nepodarilo načítať
        </p>
        <p className="max-w-md text-sm text-(--color-text-muted)">
          Skontrolujte, či je Nexus admin dostupný a povolí embed zo storefront domény
          (CSP <code className="text-xs">frame-ancestors</code> na Lovable/Vercel).
          Ak iframe auth nefunguje, prihláste sa priamo cez odkaz nižšie (Application Passwords / JWT).
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-2"
          data-testid="dashboard-direct-link"
        >
          Otvoriť WordPress admin priamo
        </a>
      </div>
    )
  }

  return (
    <div className="relative h-dvh w-full">
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-(--color-surface)"
          data-testid="dashboard-frame-loading"
        >
          <p className="text-sm text-(--color-text-muted)">Načítavam WordPress admin…</p>
        </div>
      )}
      <iframe
        src={src}
        title={title}
        className="h-dvh w-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
        allow="clipboard-write"
        data-testid="dashboard-iframe"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setLoadError(true)
        }}
      />
    </div>
  )
}