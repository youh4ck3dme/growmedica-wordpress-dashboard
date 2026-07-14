'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'growmedica-pwa-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-(--color-primary-light) bg-(--color-primary-light) p-4 md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border md:shadow-lg"
      role="region"
      aria-label="Inštalácia aplikácie"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-(--color-primary-dark)">Inštalujte GrowMedica.sk</p>
          <p className="text-sm text-(--color-text-muted)">Rýchly prístup bez prehliadača</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={handleInstall} className="btn btn-primary btn-sm">
            Inštalovať
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-secondary btn-sm"
            aria-label="Zavrieť ponuku inštalácie"
          >
            Neskôr
          </button>
        </div>
      </div>
    </div>
  )
}
