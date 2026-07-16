'use client'

import { MessageCircle } from 'lucide-react'
import { AssistantChatTrigger } from '@/components/ai/PharmacistAssistantDrawer'

export function FloatingAssistantFab() {
  return (
    <AssistantChatTrigger
      className="assistant-fab"
      data-testid="assistant-fab-trigger"
      aria-label="Poradiť sa"
    >
      <MessageCircle className="assistant-fab__icon" size={22} aria-hidden="true" />
      <span className="assistant-fab__label">Poradiť sa</span>
    </AssistantChatTrigger>
  )
}
