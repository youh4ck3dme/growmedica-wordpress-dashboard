'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { AssistantChatTrigger } from '@/components/ai/PharmacistAssistantDrawer'
import {
  CONSENT_EVENT,
  readConsent,
  type ConsentEventDetail,
} from '@/lib/cookie-consent'
import { cn } from '@/lib/utils'

export function FloatingAssistantFab() {
  const [cookieOffset, setCookieOffset] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    setCookieOffset(!existing)

    function onConsent(event: Event) {
      const detail = (event as CustomEvent<ConsentEventDetail>).detail
      setCookieOffset(Boolean(detail?.visible))
    }

    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_EVENT, onConsent)
  }, [])

  return (
    <AssistantChatTrigger
      className={cn('assistant-fab', cookieOffset && 'assistant-fab--cookie-offset')}
      data-testid="assistant-fab-trigger"
      aria-label="Poradiť sa"
    >
      <MessageCircle className="assistant-fab__icon" size={22} aria-hidden="true" />
      <span className="assistant-fab__label">Poradiť sa</span>
    </AssistantChatTrigger>
  )
}
