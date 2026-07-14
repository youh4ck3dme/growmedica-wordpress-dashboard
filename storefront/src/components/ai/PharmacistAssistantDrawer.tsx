'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Loader2, MessageCircle, Send, ShieldCheck, X } from 'lucide-react'
import { PHARMACIST_ASSISTANT_OPEN_EVENT, consumePendingAssistantOpen, openPharmacistAssistant } from '@/lib/ai/pharmacist-assistant-events'
import type { AssistantChatMessage, AssistantChatResponse } from '@/lib/ai/pharmacist-assistant'
import { SAFE_DISCLAIMER } from '@/lib/ai/compliance'

const INITIAL_ASSISTANT_MESSAGE: AssistantChatMessage = {
  role: 'assistant',
  content:
    'Som váš virtuálny lekárnik GrowMedica. Pomôžem s výberom produktu alebo s orientáciou v objednávke.',
}

const ASSISTANT_CONVERSATION_STORAGE_KEY = 'growmedica_assistant_conversation_id'

export function PharmacistAssistantDrawer() {
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantChatMessage[]>([INITIAL_ASSISTANT_MESSAGE])
  const [conversationId, setConversationId] = useState('')
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([
    'Odporuč mi produkt na spánok',
    'Ako dokončím objednávku?',
    'Kontakt na podporu',
  ])
  const [chatError, setChatError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(ASSISTANT_CONVERSATION_STORAGE_KEY)?.trim() ?? ''
        : ''
    if (stored) {
      setConversationId(stored)
      return
    }

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `asst-${Math.random().toString(36).slice(2, 12)}`
    setConversationId(generated)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ASSISTANT_CONVERSATION_STORAGE_KEY, generated)
    }
  }, [])

  useEffect(() => {
    if (consumePendingAssistantOpen()) {
      setOpen(true)
    }

    const handleOpenAssistant = () => setOpen(true)
    globalThis.addEventListener(PHARMACIST_ASSISTANT_OPEN_EVENT, handleOpenAssistant)
    return () => globalThis.removeEventListener(PHARMACIST_ASSISTANT_OPEN_EVENT, handleOpenAssistant)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('assistant-drawer-open', open)
    return () => {
      document.body.classList.remove('assistant-drawer-open')
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  const sendUserMessage = async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message || isSending) return

    setChatError(null)
    const nextMessages: AssistantChatMessage[] = [...messages, { role: 'user', content: message }]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)
    scrollToBottom()

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          conversation_id: conversationId || undefined,
        }),
      })

      const payload = (await response.json()) as AssistantChatResponse & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? 'Chat je dočasne nedostupný.')
      }

      setMessages((current) => [...current, { role: 'assistant', content: payload.message }])
      setSuggestedReplies(payload.suggested_replies ?? [])
      scrollToBottom()
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : 'Chat je dočasne nedostupný. Skúste to, prosím, o chvíľu.',
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await sendUserMessage(input)
  }

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="assistant-drawer__backdrop"
        aria-label="Zavrieť chat s lekárnikom"
        onClick={() => setOpen(false)}
      />
      <aside
        className="assistant-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="pharmacist-assistant-drawer"
      >
        <header className="assistant-drawer__header">
          <div className="assistant-drawer__title-wrap">
            <MessageCircle className="assistant-drawer__title-icon" aria-hidden="true" size={20} />
            <div>
              <h2 id={titleId} className="assistant-drawer__title">
                GrowMedica Farmaceut
              </h2>
              <p className="assistant-drawer__subtitle">
                Produktové poradenstvo a orientácia v objednávke.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="assistant-drawer__close"
            onClick={() => setOpen(false)}
            aria-label="Zavrieť"
          >
            <X size={20} />
          </button>
        </header>

        <div ref={containerRef} className="assistant-drawer__messages">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === 'assistant'
                  ? 'assistant-drawer__bubble assistant-drawer__bubble--assistant'
                  : 'assistant-drawer__bubble assistant-drawer__bubble--user'
              }
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="assistant-drawer__footer">
          {suggestedReplies.length > 0 ? (
            <div className="assistant-drawer__suggestions">
              {suggestedReplies.slice(0, 3).map((reply) => (
                <button
                  key={reply}
                  type="button"
                  className="assistant-drawer__suggestion"
                  onClick={() => void sendUserMessage(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}

          <form className="assistant-drawer__form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Napíšte správu..."
              className="assistant-drawer__input"
              disabled={isSending}
              aria-label="Správa pre lekárnika"
            />
            <button
              type="submit"
              className="assistant-drawer__send"
              disabled={isSending || input.trim().length === 0}
              aria-label="Odoslať správu"
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>

          <p className="assistant-drawer__disclaimer">
            <ShieldCheck size={12} aria-hidden="true" />
            {SAFE_DISCLAIMER}{' '}
            <Link href="/kosik" className="assistant-drawer__link" onClick={() => setOpen(false)}>
              Košík
            </Link>
            {' · '}
            <Link href="/kontakt" className="assistant-drawer__link" onClick={() => setOpen(false)}>
              Kontakt
            </Link>
          </p>
          {chatError ? <p className="assistant-drawer__error">{chatError}</p> : null}
        </div>
      </aside>
    </>
  )
}

export function AssistantChatTrigger({
  className,
  children,
  onOpen,
  'aria-label': ariaLabel = 'Otvoriť chat s lekárnikom',
  'data-testid': dataTestId = 'assistant-chat-trigger',
}: {
  className?: string
  children: ReactNode
  onOpen?: () => void
  'aria-label'?: string
  'data-testid'?: string
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      onClick={() => {
        openPharmacistAssistant()
        onOpen?.()
      }}
    >
      {children}
    </button>
  )
}
