'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AssistantChatTrigger } from '@/components/ai/PharmacistAssistantDrawer'

const COOKIE_KEY = 'gm_cookie_consent'

export function FloatingAssistantFab() {
  const [cookieBannerLikely, setCookieBannerLikely] = useState(false)

  useEffect(() => {
    const syncCookieBannerOffset = () => {
      setCookieBannerLikely(!window.localStorage.getItem(COOKIE_KEY))
    }

    syncCookieBannerOffset()
    window.addEventListener('focus', syncCookieBannerOffset)

    const intervalId = window.setInterval(syncCookieBannerOffset, 1000)
    const stopPollingId = window.setTimeout(() => window.clearInterval(intervalId), 12_000)

    return () => {
      window.removeEventListener('focus', syncCookieBannerOffset)
      window.clearInterval(intervalId)
      window.clearTimeout(stopPollingId)
    }
  }, [])

  return (
    <AssistantChatTrigger
      className={`assistant-fab${cookieBannerLikely ? ' assistant-fab--cookie-offset' : ''}`}
      data-testid="assistant-fab-trigger"
      aria-label="Poradiť sa s lekárnikom"
    >
      <MessageCircle className="assistant-fab__icon" size={22} aria-hidden="true" />
      <span className="assistant-fab__label">Poradiť sa</span>
      <span className="assistant-fab__label-short">Lekárnik</span>
    </AssistantChatTrigger>
  )
}
