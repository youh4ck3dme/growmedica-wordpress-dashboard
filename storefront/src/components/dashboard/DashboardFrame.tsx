'use client'

import { useState } from 'react'

type DashboardFrameProps = {
  src: string
  title?: string
}

export default function DashboardFrame({
  src,
  title = 'GrowMedica Dashboard',
}: DashboardFrameProps) {
  const [loadError, setLoadError] = useState(false)

  if (loadError) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-(--color-surface) px-6 text-center">
        <p className="text-lg font-semibold text-(--color-text)">
          Dashboard sa nepodarilo načítať
        </p>
        <p className="max-w-md text-sm text-(--color-text-muted)">
          Skontrolujte, či je growmedica-nexus nasadený a povolí embed zo storefront domény
          (CSP frame-ancestors). Skúste sa prihlásiť priamo na URL dashboardu mimo iframe.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-2"
        >
          Otvoriť dashboard v novom okne
        </a>
      </div>
    )
  }

  return (
    <iframe
      src={src}
      title={title}
      className="h-dvh w-full border-0"
      allow="clipboard-write"
      onError={() => setLoadError(true)}
    />
  )
}
