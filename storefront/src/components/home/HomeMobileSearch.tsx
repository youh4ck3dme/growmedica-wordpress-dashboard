'use client'

import Link from 'next/link'
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Container } from '@/components/ui/Container'
import { useT } from '@/components/i18n/LocaleProvider'
import { useProductSearch } from '@/hooks/useProductSearch'
import { getProductUrl } from '@/lib/utils'

export function HomeMobileSearch() {
  const t = useT()
  const listId = useId()
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [query, setQuery] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)

  const trimmed = query.trim()
  const { products, loading } = useProductSearch(query, suggestOpen)
  const showSuggest = suggestOpen && trimmed.length >= 2

  function clearBlurTimer() {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!query.trim()) {
      event.preventDefault()
      return
    }
    setSuggestOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setSuggestOpen(false)
    }
  }

  return (
    <div className="theme-transition noor-reveal noor-mobile-search border-b border-(--color-border) bg-(--color-surface) py-3 lg:hidden">
      <Container>
        <div className="relative">
          <form
            className="search-pill"
            role="search"
            action="/vyhladavanie"
            method="get"
            onSubmit={onSubmit}
          >
            <svg
              className="h-5 w-5 shrink-0 text-(--color-primary)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              name="q"
              className="search-pill-input"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSuggestOpen(true)
              }}
              onFocus={() => {
                clearBlurTimer()
                setSuggestOpen(true)
              }}
              onBlur={() => {
                clearBlurTimer()
                blurTimer.current = setTimeout(() => setSuggestOpen(false), 150)
              }}
              onKeyDown={onKeyDown}
              placeholder={t('home.searchPlaceholder')}
              aria-label={t('home.searchAria')}
              aria-expanded={showSuggest}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
              enterKeyHint="search"
              data-testid="home-mobile-search-input"
            />
          </form>

          {showSuggest ? (
            <div
              id={listId}
              className="search-pill-suggest"
              role="listbox"
              aria-label={t('home.searchAria')}
            >
              {loading ? (
                <p className="search-pill-suggest__hint">{t('search.loading')}</p>
              ) : products.length === 0 ? (
                <p className="search-pill-suggest__hint">{t('search.noHits')}</p>
              ) : (
                <ul className="search-pill-suggest__list">
                  {products.map((product) => (
                    <li key={product.handle} role="option">
                      <Link
                        href={getProductUrl(product.handle)}
                        className="search-pill-suggest__item"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setSuggestOpen(false)}
                      >
                        <span className="search-pill-suggest__title">{product.title}</span>
                        <span className="search-pill-suggest__meta">
                          {product.vendor ? `${product.vendor} · ` : ''}
                          {product.priceLabel}
                          {!product.availableForSale ? ` · ${t('search.soldOut')}` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={`/vyhladavanie?q=${encodeURIComponent(trimmed)}`}
                className="search-pill-suggest__all"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setSuggestOpen(false)}
              >
                {t('search.viewAll')}
              </Link>
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  )
}
