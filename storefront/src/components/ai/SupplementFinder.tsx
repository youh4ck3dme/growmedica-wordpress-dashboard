'use client'

import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SAFE_DISCLAIMER } from '@/lib/ai/compliance'
import { openPharmacistAssistant } from '@/lib/ai/pharmacist-assistant-events'
import type { AiProductSummary, RecommendApiResponse } from '@/lib/ai/schemas'
import { getProductUrl } from '@/lib/utils'

export function SupplementFinder() {
  const [input, setInput] = useState('')
  const [recommendations, setRecommendations] = useState<RecommendApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placeholder, setPlaceholder] = useState('Popíšte svoje potreby ...')

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 640) {
        setPlaceholder('Popíšte svoje potreby (napr. viac energie na tréning)')
      } else {
        setPlaceholder('Popíšte svoje potreby ...')
      }
    }

    // Nastaviť hneď pri mountnutí na klientovi
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

      const data = (await response.json()) as RecommendApiResponse & { error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? 'Chyba pri spracovaní požiadavky.')
      }

      setRecommendations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať odporúčania.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-4">
        <style dangerouslySetInnerHTML={{ __html: `
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
        `}} />

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight text-(--color-text)" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Nájdite vhodný doplnok
          </h2>
          <p className="text-sm text-(--color-text-muted) max-w-lg mx-auto">
            AI asistent vám pomôže vybrať produkty na mieru z našej ponuky. {SAFE_DISCLAIMER}
          </p>
          <button
            type="button"
            className="ai-widget-chat-link mt-2"
            onClick={() => openPharmacistAssistant()}
          >
            Poradiť sa s lekárnikom
          </button>
        </div>

        {/* Hlavný prémiový vyhľadávač v štýle Google/Gemini s animovaným dúhovým okrajom */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-10">
          {/* Obal s rotujúcim dúhovým hadíkom */}
          <div className="relative p-[2px] overflow-hidden rounded-2xl bg-(--color-border)">
            
            {/* Traveling neon beam */}
            <div className="w-[108px] h-[108px] rounded-full bg-gradient-to-r from-[#35C79A] via-[#4f46e5] to-[#ec4899] blur-sm opacity-90 animate-spin-gradient" />
            
            {/* Vnútorná maska (stred riadku), ktorá prekrýva gradient a vytvára tenký okraj */}
            <div className="relative flex items-center p-1.5 rounded-[14px] bg-white dark:bg-(--color-surface-2)">
              
              {/* Ikona AI / Sparkles */}
              <div className="pl-3 pr-1 text-(--color-primary) shrink-0 flex items-center justify-center">
                <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21L8.188 15.904L3 15L8.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904ZM19.071 5.929L18.5 9L17.929 5.929L15 5.358L17.929 4.787L18.5 1.714L19.071 4.787L22 5.358L19.071 5.929Z" />
                </svg>
              </div>
              
              {/* Input pole */}
              <input
                type="text"
                placeholder={placeholder}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={loading}
                className="w-full py-3 px-2 text-sm sm:text-base text-(--color-text) bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-xs sm:placeholder:text-base placeholder:text-(--color-text-muted) disabled:opacity-50"
                aria-label="Popíšte svoje potreby pre hľadanie doplnkov"
              />
              
              {/* Prémiové tlačidlo vo vnútri */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                disabled={!input.trim()}
                className="supplement-finder-submit rounded-xl shrink-0 px-6 font-bold tracking-wide transition-all bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-none flex items-center gap-1.5"
              >
                {!loading && (
                  <>
                    <span>Nájsť doplnky</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

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
            className="mt-4 p-4 border border-(--color-error) rounded-lg bg-(--color-surface-2) text-(--color-error)"
          >
            {error}
          </div>
        )}

        {recommendations && !loading && (
          <div className="mt-6 space-y-6">
            <div className="p-4 border border-(--color-border) rounded-lg bg-(--color-surface-2)">
              <p className="text-(--color-text)">{recommendations.summary}</p>
              <p className="mt-4 text-sm text-(--color-text-muted)">
                {recommendations.reasoningForUser}
              </p>
            </div>

            {recommendations.recommendedProducts.length > 0 ? (
              <ProductLinkList
                heading="Odporúčané produkty"
                products={recommendations.recommendedProducts}
              />
            ) : (
              <EmptyState
                title="Nenašli sa vhodné produkty"
                description={recommendations.reasoningForUser}
                icon="search"
              />
            )}

            {recommendations.bundleSuggestion && recommendations.bundleProducts.length > 0 && (
              <div className="p-4 border border-(--color-border) rounded-lg bg-(--color-surface-2)">
                <h3 className="font-semibold mb-2 text-(--color-text)">
                  {recommendations.bundleSuggestion.title}
                </h3>
                <p className="text-(--color-text-muted) mb-3">
                  {recommendations.bundleSuggestion.cta}
                </p>
                <ProductLinkList products={recommendations.bundleProducts} />
              </div>
            )}

            {recommendations.warnings.length > 0 && (
              <div
                role="alert"
                className="p-4 border border-(--color-warning) rounded-lg bg-(--color-surface-2)"
              >
                <h4 className="font-semibold mb-2 text-(--color-warning)">Upozornenia</h4>
                <ul className="list-disc pl-5 space-y-1 text-(--color-text)">
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
      {heading && <h3 className="text-lg font-semibold mb-3 text-(--color-text)">{heading}</h3>}
      <ul className="list-disc pl-5 space-y-2">
        {products.map((product) => (
          <li key={product.handle} className="text-(--color-text)">
            <Link
              href={getProductUrl(product.handle)}
              className="underline hover:text-(--color-primary) transition-colors"
            >
              {product.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
