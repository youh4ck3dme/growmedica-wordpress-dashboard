'use client'

import { MessageCircle } from 'lucide-react'
import { AssistantChatTrigger } from '@/components/ai/PharmacistAssistantDrawer'

export function FooterAssistantTrigger() {
  return (
    <AssistantChatTrigger className="assistant-footer-trigger">
      <MessageCircle size={16} aria-hidden="true" />
      Poradiť sa s lekárnikom
    </AssistantChatTrigger>
  )
}
