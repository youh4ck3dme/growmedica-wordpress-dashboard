'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Loader2, MessageCircle, Send, ShieldCheck, X } from 'lucide-react'
import { PHARMACIST_ASSISTANT_OPEN_EVENT, consumePendingAssistantOpen, openPharmacistAssistant } from '@/lib/ai/pharmacist-assistant-events'
import type { AssistantChatMessage, AssistantChatResponse } from '@/lib/ai/pharmacist-assistant'
import { useT } from '@/components/i18n/LocaleProvider'

const ASSISTANT_CONVERSATION_STORAGE_KEY = 'growmedica_assistant_conversation_id'

export function PharmacistAssistantDrawer() {
  const t = useT()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const initialMessage = useMemo<AssistantChatMessage>(
    () => ({ role: 'assistant', content: t('assistant.initial') }),
    [t],
  )
  const [messages, setMessages] = useState<AssistantChatMessage[]>([initialMessage])
  const [conversationId, setConversationId] = useState('')
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([])
  const [chatError, setChatError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const bootstrappedLocale = useRef(false)

  useEffect(() => {
    // Reset greeting/suggestions when locale translator changes
    if (!bootstrappedLocale.current) {
      bootstrappedLocale.current = true
      setMessages([initialMessage])
      setSuggestedReplies([
        t('assistant.suggest1'),
        t('assistant.suggest2'),
        t('assistant.suggest3'),
      ])
      return
    }
    setMessages([initialMessage])
    setSuggestedReplies([
      t('assistant.suggest1'),
      t('assistant.suggest2'),
      t('assistant.suggest3'),
    ])
  }, [initialMessage, t])

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
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
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
        throw new Error(payload.error ?? t('assistant.unavailable'))
      }

      setMessages((current) => [...current, { role: 'assistant', content: payload.message }])
      setSuggestedReplies(payload.suggested_replies ?? [])
      scrollToBottom()
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : t('assistant.unavailableRetry'),
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
        aria-label={t('assistant.closeChat')}
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
            <div className="assistant-drawer__avatar" aria-hidden="true">
              <MessageCircle className="assistant-drawer__title-icon" size={22} />
            </div>
            <div className="assistant-drawer__heading">
              <h2 id={titleId} className="assistant-drawer__title">
                {t('assistant.headerTitle')}
              </h2>
              <p className="assistant-drawer__subtitle">
                {t('assistant.subtitle')}
              </p>
              <p className="assistant-drawer__status">
                <span className="assistant-drawer__status-dot" aria-hidden="true" />
                {t('assistant.statusOnline')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="assistant-drawer__close"
            onClick={() => setOpen(false)}
            aria-label={t('assistant.close')}
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
                  ? 'assistant-drawer__row assistant-drawer__row--assistant'
                  : 'assistant-drawer__row assistant-drawer__row--user'
              }
            >
              {message.role === 'assistant' ? (
                <div className="assistant-drawer__bubble-avatar" aria-hidden="true">
                  <MessageCircle size={14} />
                </div>
              ) : null}
              <div
                className={
                  message.role === 'assistant'
                    ? 'assistant-drawer__bubble assistant-drawer__bubble--assistant'
                    : 'assistant-drawer__bubble assistant-drawer__bubble--user'
                }
              >
                {message.content}
              </div>
            </div>
          ))}
          {isSending ? (
            <div className="assistant-drawer__row assistant-drawer__row--assistant" aria-live="polite">
              <div className="assistant-drawer__bubble-avatar" aria-hidden="true">
                <MessageCircle size={14} />
              </div>
              <div className="assistant-drawer__bubble assistant-drawer__bubble--assistant assistant-drawer__bubble--typing">
                <span className="assistant-drawer__typing" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="sr-only">{t('assistant.typing')}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="assistant-drawer__footer">
          {suggestedReplies.length > 0 ? (
            <div className="assistant-drawer__suggestions" aria-label={t('assistant.suggestionsLabel')}>
              {suggestedReplies.slice(0, 3).map((reply) => (
                <button
                  key={reply}
                  type="button"
                  className="assistant-drawer__suggestion"
                  disabled={isSending}
                  onClick={() => void sendUserMessage(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}

          <form className="assistant-drawer__form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('assistant.placeholder')}
              className="assistant-drawer__input"
              disabled={isSending}
              aria-label={t('assistant.messageAria')}
              autoComplete="off"
            />
            <button
              type="submit"
              className="assistant-drawer__send"
              disabled={isSending || input.trim().length === 0}
              aria-label={t('assistant.sendAria')}
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>

          <p className="assistant-drawer__disclaimer">
            <ShieldCheck size={13} aria-hidden="true" className="assistant-drawer__disclaimer-icon" />
            <span>
              {t('finder.disclaimer')}{' '}
              <Link href="/kosik" className="assistant-drawer__link" onClick={() => setOpen(false)}>
                {t('cart.pageTitle')}
              </Link>
              {' · '}
              <Link href="/kontakt" className="assistant-drawer__link" onClick={() => setOpen(false)}>
                {t('footer.contact')}
              </Link>
            </span>
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
  'aria-label': ariaLabel,
  'data-testid': dataTestId = 'assistant-chat-trigger',
}: {
  className?: string
  children: ReactNode
  onOpen?: () => void
  'aria-label'?: string
  'data-testid'?: string
}) {
  const t = useT()
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel ?? t('assistant.triggerAria')}
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
