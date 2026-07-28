'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { AssistantChatTrigger } from '@/components/ai/PharmacistAssistantDrawer'
import {
  CONSENT_EVENT,
  hasConsentDecision,
  readConsent,
  type ConsentEventDetail,
} from '@/lib/cookie-consent'
import { useT } from '@/components/i18n/LocaleProvider'

export function FloatingAssistantFab() {
  const t = useT()
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    function sync(consent = readConsent()) {
      setAllowed(hasConsentDecision(consent))
      setReady(true)
    }

    sync()

    function onConsent(event: Event) {
      const detail = (event as CustomEvent<ConsentEventDetail>).detail
      // Show chatbot only after the user makes a consent choice (banner closed).
      setAllowed(hasConsentDecision(detail?.consent ?? null) && !detail?.visible)
    }

    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_EVENT, onConsent)
  }, [])

  if (!ready || !allowed) return null

  return (
    <AssistantChatTrigger
      className="assistant-fab"
      data-testid="assistant-fab-trigger"
      aria-label={t('assistant.triggerAria')}
    >
      <MessageCircle className="assistant-fab__icon" size={22} aria-hidden="true" />
      <span className="assistant-fab__label">{t('assistant.triggerAria')}</span>
    </AssistantChatTrigger>
  )
}
