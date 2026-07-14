'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ANNOUNCEMENT_BAR } from '@/lib/brand'

const STORAGE_KEY = 'growmedica-announcement-dismissed'

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!ANNOUNCEMENT_BAR.enabled) return
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  if (!ANNOUNCEMENT_BAR.enabled) return null

  const showBar = mounted && !dismissed

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      className={`announcement-bar-slot${!mounted || !dismissed ? ' announcement-bar-slot--reserved' : ''}`}
      data-visible={showBar ? 'true' : 'false'}
      aria-hidden={!showBar}
    >
      {showBar ? (
        <div className="announcement-bar" role="region" aria-label="Aktuálna ponuka">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center text-xs font-semibold sm:text-sm">
            <span className="announcement-bar__text">{ANNOUNCEMENT_BAR.message}</span>
            {ANNOUNCEMENT_BAR.href && (
              <Link
                href={ANNOUNCEMENT_BAR.href}
                className="announcement-bar__link shrink-0 underline underline-offset-2"
              >
                {ANNOUNCEMENT_BAR.linkLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="announcement-bar__close ml-auto shrink-0 rounded p-1"
              aria-label="Zavrieť oznámenie"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
