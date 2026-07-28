'use client'

import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { AiProductSummary, RecommendApiResponse } from '@/lib/ai/schemas'
import { getProductUrl } from '@/lib/utils'
import { useLocale, useT } from '@/components/i18n/LocaleProvider'

const GOAL_CHIPS = [
  { labelKey: 'finder.chip1' as const, promptKey: 'finder.chip1Prompt' as const },
  { labelKey: 'finder.chip2' as const, promptKey: 'finder.chip2Prompt' as const },
  { labelKey: 'finder.chip3' as const, promptKey: 'finder.chip3Prompt' as const },
]

export function SupplementFinder() {
  const t = useT()
  const { locale } = useLocale()
  const [input, setInput] = useState('')
  const [recommendations, setRecommendations] = useState<RecommendApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placeholder, setPlaceholder] = useState(t('finder.placeholder'))

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 640) {
        setPlaceholder(t('finder.placeholderLong'))
      } else {
        setPlaceholder(t('finder.placeholder'))
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [locale, t])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#supplement-finder') return
    document.getElementById('supplement-finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input.trim() }),
      })

      const data = (await response.json()) as RecommendApiResponse & { error?: unknown }
      if (!response.ok) {
        const raw = data.error
        const message =
          typeof raw === 'string' && raw.trim() && !raw.trimStart().startsWith('[')
            ? raw
            : t('finder.errorGeneric')
        throw new Error(message)
      }

      setRecommendations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('finder.errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="supplement-finder" className="supplement-finder scroll-mt-24 py-12" aria-label={t('finder.title')}>
      <div className="mx-auto max-w-3xl px-4">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes spin-gradient {
            0% { left: 0%; top: 0%; }
            45.9% { left: 100%; top: 0%; }
            50% { left: 100%; top: 100%; }
            95.9% { left: 0%; top: 100%; }
            100% { left: 0%; top: 0%; }
          }
          .animate-spin-gradient {
            position: absolute;
            animation: spin-gradient 6s linear infinite normal;
            transform: translate(-50%, -50%);
          }
        `,
          }}
        />

        <div className="mb-8 text-center">
          <p className="supplement-finder__eyebrow mb-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-(--color-primary)">
            {t('finder.eyebrow')}
          </p>
          <h2
            className="mb-3 text-3xl font-extrabold tracking-tight text-(--color-text)"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {t('finder.title')}
          </h2>
          <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-(--color-text-muted)">
            {t('finder.lead')}
          </p>

          <ol className="supplement-finder__steps mx-auto mb-5 flex max-w-xl flex-wrap items-center justify-center gap-2">
            <li className="supplement-finder__step">
              <span className="supplement-finder__step-num">1</span>
              {t('finder.step1')}
            </li>
            <li className="supplement-finder__step">
              <span className="supplement-finder__step-num">2</span>
              {t('finder.step2')}
            </li>
            <li className="supplement-finder__step">
              <span className="supplement-finder__step-num">3</span>
              {t('finder.step3')}
            </li>
          </ol>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-2" aria-label={t('finder.chipsLabel')}>
            {GOAL_CHIPS.map((chip) => (
              <button
                key={chip.labelKey}
                type="button"
                className="supplement-finder__chip"
                disabled={loading}
                onClick={() => setInput(t(chip.promptKey))}
              >
                {t(chip.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative mx-auto mb-6 max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl bg-(--color-border) p-[2px]">
            <div className="animate-spin-gradient h-[108px] w-[108px] rounded-full bg-gradient-to-r from-[#35C79A] via-[#4f46e5] to-[#ec4899] opacity-90 blur-sm" />

            <div className="relative flex flex-col gap-2 rounded-[14px] bg-white p-1.5 dark:bg-(--color-surface-2) sm:flex-row sm:items-center sm:gap-0">
              <div className="flex min-w-0 flex-1 items-center">
                <div className="flex shrink-0 items-center justify-center pl-3 pr-1 text-(--color-primary)">
                  <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 21L8.188 15.904L3 15L8.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904ZM19.071 5.929L18.5 9L17.929 5.929L15 5.358L17.929 4.787L18.5 1.714L19.071 4.787L22 5.358L19.071 5.929Z"
                    />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder={placeholder}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={loading}
                  className="min-w-0 w-full border-0 bg-transparent px-2 py-3 text-sm text-(--color-text) placeholder:text-xs placeholder:text-(--color-text-muted) focus:outline-none focus:ring-0 disabled:opacity-50 sm:text-base sm:placeholder:text-base"
                  aria-label={t('finder.inputAria')}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                disabled={!input.trim()}
                className="supplement-finder-submit flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border-0 bg-gradient-to-r from-teal-500 to-emerald-600 px-6 font-bold tracking-wide text-white shadow-none transition-all hover:from-teal-600 hover:to-emerald-700 sm:w-auto"
              >
                {!loading && (
                  <>
                    <span>{t('finder.submit')}</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <p className="mx-auto mb-5 max-w-xl text-center text-xs leading-relaxed text-(--color-text-muted)">
          {t('finder.disclaimer')}
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/balicky" className="font-semibold text-(--color-primary) hover:text-(--color-primary-dark)">
            {t('about.bundlesCta')}
          </Link>
          <span className="text-(--color-border)" aria-hidden="true">
            ·
          </span>
          <Link href="/o-nas" className="font-semibold text-(--color-text-muted) hover:text-(--color-text)">
            {t('about.moreAbout')}
          </Link>
        </div>

        {loading && (
          <div className="mt-6 space-y-4" aria-live="polite">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-(--color-error) bg-(--color-surface-2) p-4 text-(--color-error)"
          >
            {error}
          </div>
        )}

        {recommendations && !loading && (
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border border-(--color-border) bg-(--color-surface-2) p-4">
              <p className="text-(--color-text)">{recommendations.summary}</p>
              <p className="mt-4 text-sm text-(--color-text-muted)">{recommendations.reasoningForUser}</p>
            </div>

            {recommendations.recommendedProducts.length > 0 ? (
              <ProductLinkList
                heading={t('finder.recommended')}
                products={recommendations.recommendedProducts}
              />
            ) : (
              <EmptyState
                title={t('finder.noMatch')}
                description={recommendations.reasoningForUser}
                icon="search"
              />
            )}

            {recommendations.bundleSuggestion && recommendations.bundleProducts.length > 0 && (
              <div className="rounded-lg border border-(--color-border) bg-(--color-surface-2) p-4">
                <h3 className="mb-2 font-semibold text-(--color-text)">{recommendations.bundleSuggestion.title}</h3>
                <p className="mb-3 text-(--color-text-muted)">{recommendations.bundleSuggestion.cta}</p>
                <ProductLinkList products={recommendations.bundleProducts} />
              </div>
            )}

            {recommendations.warnings.length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-(--color-warning) bg-(--color-surface-2) p-4"
              >
                <h4 className="mb-2 font-semibold text-(--color-warning)">{t('finder.warnings')}</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-(--color-text)">
                  {recommendations.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function ProductLinkList({
  heading,
  products,
}: {
  heading?: string
  products: AiProductSummary[]
}) {
  return (
    <div>
      {heading ? <h3 className="mb-3 font-semibold text-(--color-text)">{heading}</h3> : null}
      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.handle}>
            <Link
              href={getProductUrl(product.handle)}
              className="block rounded-lg border border-(--color-border) bg-white px-4 py-3 text-sm font-medium text-(--color-text) transition hover:border-(--color-primary) hover:text-(--color-primary)"
            >
              {product.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
