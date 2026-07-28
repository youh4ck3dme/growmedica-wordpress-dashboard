'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'

const STORAGE_KEY = 'growmedica-pwa-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallBanner() {
  const t = useT()
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
      className="pwa-install-bar"
      role="region"
      aria-label={t('pwa.aria')}
      data-testid="pwa-install-banner"
    >
      <div className="pwa-install-bar__inner">
        <div className="pwa-install-bar__copy min-w-0">
          <p className="pwa-install-bar__title">{t('pwa.title')}</p>
          <p className="pwa-install-bar__subtitle">{t('pwa.subtitle')}</p>
        </div>
        <div className="pwa-install-bar__actions shrink-0">
          <button type="button" onClick={handleInstall} className="btn btn-primary btn-sm">
            {t('pwa.install')}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-secondary btn-sm"
            aria-label={t('pwa.dismissAria')}
          >
            {t('pwa.later')}
          </button>
        </div>
      </div>
    </div>
  )
}
