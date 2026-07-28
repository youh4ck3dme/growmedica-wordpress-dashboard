'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Loader2, MessageCircle, Send, ShieldAlert, ShieldCheck, Sparkles, X } from 'lucide-react'
import { PHARMACIST_ASSISTANT_OPEN_EVENT, consumePendingAssistantOpen, openPharmacistAssistant } from '@/lib/ai/pharmacist-assistant-events'
import type { AssistantChatMessage, AssistantChatResponse, AssistantProductCard } from '@/lib/ai/pharmacist-assistant'
import { useT } from '@/components/i18n/LocaleProvider'

const ASSISTANT_CONVERSATION_STORAGE_KEY = 'growmedica_assistant_conversation_id'

type DrawerMessage = AssistantChatMessage & {
  recommendedProducts?: AssistantProductCard[]
  warning?: string | null
  nextStep?: string | null
  bundleSuggestion?: AssistantChatResponse['bundle_suggestion']
}

function ProductRecommendationCard({ product, compact = false }: { product: AssistantProductCard; compact?: boolean }) {
  return (
    <Link
      href={product.url}
      className={`group rounded-2xl border border-(--color-border) bg-white/90 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-(--color-primary) hover:shadow-md ${compact ? 'flex items-center gap-3' : 'block'}`}
    >
      <div className={compact ? 'relative h-16 w-16 overflow-hidden rounded-xl bg-(--color-surface-muted)' : 'relative mb-3 aspect-square overflow-hidden rounded-2xl bg-(--color-surface-muted)'}>
        <Image
          src={product.imageUrl ?? '/images/product-placeholder.svg'}
          alt={product.title}
          fill
          sizes={compact ? '64px' : '(max-width: 768px) 120px, 180px'}
          className='object-contain p-2'
        />
      </div>
      <div className='min-w-0'>
        {product.vendor ? (
          <p className='mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)'>
            {product.vendor}
          </p>
        ) : null}
        <h4 className='line-clamp-2 text-sm font-semibold text-(--color-text)'>{product.title}</h4>
        {product.priceFrom ? <p className='mt-1 text-sm font-medium text-(--color-primary)'>{product.priceFrom}</p> : null}
        <span className='mt-2 inline-flex text-xs font-semibold text-(--color-primary)'>
          Detail produktu →
        </span>
      </div>
    </Link>
  )
}

export function PharmacistAssistantDrawer() {
  const t = useT()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const initialMessage = useMemo<DrawerMessage>(
    () => ({ role: 'assistant', content: t('assistant.initial') }),
    [t],
  )
  const [messages, setMessages] = useState<DrawerMessage[]>([initialMessage])
  const [conversationId, setConversationId] = useState('')
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([])
  const [chatError, setChatError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const bootstrappedLocale = useRef(false)

  useEffect(() => {
    if (!bootstrappedLocale.current) {
      bootstrappedLocale.current = true
      setMessages([initialMessage])
      setSuggestedReplies([t('assistant.suggest1'), t('assistant.suggest2'), t('assistant.suggest3')])
      return
    }
    setMessages([initialMessage])
    setSuggestedReplies([t('assistant.suggest1'), t('assistant.suggest2'), t('assistant.suggest3')])
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
    const nextMessages: AssistantChatMessage[] = messages.map(({ role, content }) => ({ role, content })).concat({
      role: 'user',
      content: message,
    })
    setMessages((current) => [...current, { role: 'user', content: message }])
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

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: payload.message,
          recommendedProducts: payload.recommended_products ?? [],
          warning: payload.warning ?? null,
          nextStep: payload.next_step ?? null,
          bundleSuggestion: payload.bundle_suggestion ?? null,
        },
      ])
      setSuggestedReplies(payload.suggested_replies ?? [])
      scrollToBottom()
    } catch (error) {
      setChatError(error instanceof Error ? error.message : t('assistant.unavailableRetry'))
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
        type='button'
        className='assistant-drawer__backdrop'
        aria-label={t('assistant.closeChat')}
        onClick={() => setOpen(false)}
      />
      <aside
        className='assistant-drawer'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        data-testid='pharmacist-assistant-drawer'
      >
        <header className='assistant-drawer__header'>
          <div className='assistant-drawer__title-wrap'>
            <div className='assistant-drawer__avatar' aria-hidden='true'>
              <MessageCircle className='assistant-drawer__title-icon' size={22} />
            </div>
            <div className='assistant-drawer__heading'>
              <h2 id={titleId} className='assistant-drawer__title'>
                {t('assistant.headerTitle')}
              </h2>
              <p className='assistant-drawer__subtitle'>{t('assistant.subtitle')}</p>
              <p className='assistant-drawer__status'>
                <span className='assistant-drawer__status-dot' aria-hidden='true' />
                {t('assistant.statusOnline')}
              </p>
            </div>
          </div>
          <button
            type='button'
            className='assistant-drawer__close'
            onClick={() => setOpen(false)}
            aria-label={t('assistant.close')}
          >
            <X size={20} />
          </button>
        </header>

        <div ref={containerRef} className='assistant-drawer__messages'>
          {messages.map((message, index) => {
            const isAssistant = message.role === 'assistant'
            return (
              <div
                key={`${message.role}-${index}`}
                className={
                  isAssistant
                    ? 'assistant-drawer__row assistant-drawer__row--assistant'
                    : 'assistant-drawer__row assistant-drawer__row--user'
                }
              >
                {isAssistant ? (
                  <div className='assistant-drawer__bubble-avatar' aria-hidden='true'>
                    <MessageCircle size={14} />
                  </div>
                ) : null}
                <div className='min-w-0'>
                  <div
                    className={
                      isAssistant
                        ? 'assistant-drawer__bubble assistant-drawer__bubble--assistant'
                        : 'assistant-drawer__bubble assistant-drawer__bubble--user'
                    }
                  >
                    {message.content}
                  </div>

                  {isAssistant && (message.recommendedProducts?.length || message.warning || message.nextStep || message.bundleSuggestion) ? (
                    <div className='mt-3 space-y-3'>
                      {message.recommendedProducts?.length ? (
                        <section className='rounded-2xl border border-(--color-border) bg-white/75 p-3' data-testid='assistant-products-section'>
                          <p className='mb-2 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-(--color-text-muted)'>
                            <Sparkles size={13} /> {t('assistant.productsLabel')}
                          </p>
                          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                            {message.recommendedProducts.slice(0, 4).map((product) => (
                              <ProductRecommendationCard key={product.handle} product={product} />
                            ))}
                          </div>
                        </section>
                      ) : (
                        <section className='rounded-2xl border border-dashed border-(--color-border) bg-white/70 p-3' data-testid='assistant-empty-state'>
                          <p className='mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-(--color-text-muted)'>
                            {t('assistant.productsLabel')}
                          </p>
                          <p className='text-sm text-(--color-text-muted)'>{t('assistant.emptyProducts')}</p>
                        </section>
                      )}

                      {message.bundleSuggestion?.products?.length ? (
                        <section className='rounded-2xl border border-(--color-primary)/20 bg-(--color-primary-light)/20 p-3' data-testid='assistant-bundle-section'>
                          <p className='mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-(--color-text-muted)'>
                            {t('assistant.bundleLabel')}
                          </p>
                          <p className='mb-3 text-sm font-semibold text-(--color-text)'>
                            {message.bundleSuggestion.title}
                          </p>
                          <div className='space-y-2'>
                            {message.bundleSuggestion.products.map((product) => (
                              <ProductRecommendationCard key={`bundle-${product.handle}`} product={product} compact />
                            ))}
                          </div>
                          <p className='mt-3 text-sm font-medium text-(--color-primary)'>
                            {message.bundleSuggestion.cta}
                          </p>
                        </section>
                      ) : null}

                      {message.warning ? (
                        <section className='rounded-2xl border border-amber-200 bg-amber-50/90 p-3' data-testid='assistant-warning-section'>
                          <p className='mb-2 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-amber-700'>
                            <ShieldAlert size={13} /> {t('assistant.warningLabel')}
                          </p>
                          <p className='text-sm text-amber-900'>{message.warning}</p>
                        </section>
                      ) : null}

                      {message.nextStep ? (
                        <section className='rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3' data-testid='assistant-next-step-section'>
                          <p className='mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-emerald-700'>
                            {t('assistant.nextStepLabel')}
                          </p>
                          <p className='text-sm text-emerald-900'>{message.nextStep}</p>
                        </section>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
          {isSending ? (
            <div className='assistant-drawer__row assistant-drawer__row--assistant' aria-live='polite'>
              <div className='assistant-drawer__bubble-avatar' aria-hidden='true'>
                <MessageCircle size={14} />
              </div>
              <div className='min-w-0 space-y-3'>
                <div className='assistant-drawer__bubble assistant-drawer__bubble--assistant assistant-drawer__bubble--typing'>
                  <span className='assistant-drawer__typing' aria-hidden='true'>
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className='sr-only'>{t('assistant.typing')}</span>
                </div>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2' data-testid='assistant-loading-cards'>
                  {[0, 1].map((card) => (
                    <div key={card} className='animate-pulse rounded-2xl border border-(--color-border) bg-white/70 p-3'>
                      <div className='mb-3 aspect-square rounded-2xl bg-(--color-surface-muted)' />
                      <div className='h-3 w-16 rounded bg-(--color-surface-muted)' />
                      <div className='mt-2 h-4 w-4/5 rounded bg-(--color-surface-muted)' />
                      <div className='mt-2 h-4 w-2/5 rounded bg-(--color-surface-muted)' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className='assistant-drawer__footer assistant-drawer__footer--sticky'>
          {suggestedReplies.length > 0 ? (
            <div className='assistant-drawer__suggestions' aria-label={t('assistant.suggestionsLabel')}>
              {suggestedReplies.slice(0, 3).map((reply, index) => (
                <button
                  key={reply}
                  type='button'
                  className={`assistant-drawer__suggestion ${index === 0 ? 'assistant-drawer__suggestion--primary' : ''}`}
                  disabled={isSending}
                  onClick={() => void sendUserMessage(reply)}
                >
                  {index === 0 ? `${t('assistant.startHere')}: ${reply}` : reply}
                </button>
              ))}
            </div>
          ) : null}

          <form className='assistant-drawer__form' onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('assistant.placeholder')}
              className='assistant-drawer__input'
              disabled={isSending}
              aria-label={t('assistant.messageAria')}
              autoComplete='off'
            />
            <button
              type='submit'
              className='assistant-drawer__send'
              disabled={isSending || input.trim().length === 0}
              aria-label={t('assistant.sendAria')}
            >
              {isSending ? <Loader2 className='animate-spin' size={18} /> : <Send size={18} />}
            </button>
          </form>

          <p className='assistant-drawer__disclaimer'>
            <ShieldCheck size={13} aria-hidden='true' className='assistant-drawer__disclaimer-icon' />
            <span>
              {t('finder.disclaimer')} {' '}
              <Link href='/kosik' className='assistant-drawer__link' onClick={() => setOpen(false)}>
                {t('cart.pageTitle')}
              </Link>
              {' · '}
              <Link href='/kontakt' className='assistant-drawer__link' onClick={() => setOpen(false)}>
                {t('footer.contact')}
              </Link>
            </span>
          </p>
          {chatError ? <p className='assistant-drawer__error'>{chatError}</p> : null}
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
      type='button'
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
