'use client'

import Link from 'next/link'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import { useProductSearch } from '@/hooks/useProductSearch'
import { getProductUrl } from '@/lib/utils'

interface SearchDrawerContextValue {
  open: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const SearchDrawerContext = createContext<SearchDrawerContextValue | null>(null)

export function SearchDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openDrawer = useCallback(() => setOpen(true), [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  return (
    <SearchDrawerContext.Provider value={{ open, openDrawer, closeDrawer }}>
      {children}
      <SearchDrawerPanel open={open} onClose={closeDrawer} />
    </SearchDrawerContext.Provider>
  )
}

export function useSearchDrawer(): SearchDrawerContextValue {
  const ctx = useContext(SearchDrawerContext)
  if (!ctx) {
    throw new Error('useSearchDrawer must be used within SearchDrawerProvider')
  }
  return ctx
}

function SearchDrawerPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const { products: results, loading } = useProductSearch(query, open)

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }

    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="noor-search-drawer__backdrop"
        aria-label={t('search.closeSuggestions')}
        onClick={onClose}
      />
      <aside
        className="noor-search-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="noor-search-drawer__header">
          <h2 id={titleId} className="noor-search-drawer__title">
            {t('search.title')}
          </h2>
          <button
            type="button"
            className="noor-search-drawer__close"
            onClick={onClose}
            aria-label={t('search.closeSuggestions')}
          >
            ×
          </button>
        </div>

        <div className="noor-search-drawer__body">
          <label htmlFor="noor-search-input" className="sr-only">
            {t('home.searchAria')}
          </label>
          <input
            ref={inputRef}
            id="noor-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            className="noor-input noor-search-drawer__input"
            autoComplete="off"
            enterKeyHint="search"
          />

          {loading ? (
            <p className="noor-search-drawer__hint">{t('search.loading')}</p>
          ) : query.trim().length < 2 ? (
            <p className="noor-search-drawer__hint">{t('search.minChars')}</p>
          ) : results.length === 0 ? (
            <p className="noor-search-drawer__hint">{t('search.noHits')}</p>
          ) : (
            <ul className="noor-search-drawer__results">
              {results.map((product) => (
                <li key={product.handle}>
                  <Link
                    href={getProductUrl(product.handle)}
                    className="noor-search-drawer__result"
                    onClick={onClose}
                  >
                    <span className="noor-search-drawer__result-title">{product.title}</span>
                    <span className="noor-search-drawer__result-meta">
                      {product.vendor ? `${product.vendor} · ` : ''}
                      {product.priceLabel}
                      {!product.availableForSale ? ` · ${t('search.soldOut')}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 ? (
            <Link
              href={`/vyhladavanie?q=${encodeURIComponent(query.trim())}`}
              className="noor-search-drawer__all"
              onClick={onClose}
            >
              {t('search.viewAll')}
            </Link>
          ) : null}
        </div>
      </aside>
    </>
  )
}

export function SearchDrawerTrigger({
  className,
  children,
  id,
  'aria-label': ariaLabel = 'Otvoriť vyhľadávanie',
}: {
  className?: string
  children: ReactNode
  id?: string
  'aria-label'?: string
}) {
  const { openDrawer } = useSearchDrawer()

  return (
    <button type="button" id={id} className={className} onClick={openDrawer} aria-label={ariaLabel}>
      {children}
    </button>
  )
}
