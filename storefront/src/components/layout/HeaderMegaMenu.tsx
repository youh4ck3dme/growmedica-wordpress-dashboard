'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Container } from '@/components/ui/Container'
import CategoryMegaPanel from '@/components/layout/CategoryMegaPanel'
import { useHoverIntent } from '@/hooks/useHoverIntent'
import type { NavCollectionItem } from '@/lib/catalog/nav'
import type { ProductListItem } from '@/lib/shopify/types'

export type MegaMenuCategory = NavCollectionItem & {
  featuredProducts?: ProductListItem[]
}

interface HeaderMegaMenuProps {
  categories: MegaMenuCategory[]
}

export default function HeaderMegaMenu({ categories }: HeaderMegaMenuProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [activeHandle, setActiveHandle] = useState(categories[0]?.handle ?? '')

  const { isOpen, isIntent, handleEnter, handleLeave, open, close } = useHoverIntent({
    openDelay: 350,
    closeDelay: 200,
    onOpen: () => setMounted(true),
  })

  useEffect(() => {
    if (categories[0]?.handle && !activeHandle) {
      setActiveHandle(categories[0].handle)
    }
  }, [categories, activeHandle])

  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', onPointerDown)
    }
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isOpen, close])

  const handleNavigate = useCallback(() => {
    close()
  }, [close])

  const handleCategoryHover = useCallback((handle: string) => {
    setActiveHandle(handle)
  }, [])

  const prefetchCategory = useCallback((href: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    const active = categories.find((c) => c.handle === activeHandle)
    if (active && isOpen) prefetchCategory(active.href)
  }, [activeHandle, categories, isOpen, prefetchCategory])

  const navLinkClass =
    'px-3 py-2 text-sm font-semibold text-(--color-text-muted) hover:text-(--color-primary) transition-colors uppercase tracking-wider relative group whitespace-nowrap flex items-center gap-1'

  return (
    <div
      ref={wrapperRef}
      className="relative hidden lg:block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        id="category-mega-menu-trigger"
        className={`${navLinkClass} ${isOpen ? 'text-(--color-primary)' : ''}`}
        style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em', fontSize: '0.72rem' }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="category-mega-menu-panel"
        onClick={() => (isOpen ? close() : open())}
      >
        Kategórie
        <svg
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span
          className={`mega-menu-intent-bar ${isIntent && !isOpen ? 'mega-menu-intent-bar--active' : ''}`}
          aria-hidden="true"
        />
      </button>

      {mounted && isOpen && (
        <>
          <div
            className="mega-menu-backdrop"
            aria-hidden="true"
            onClick={close}
            onMouseEnter={handleLeave}
          />
          <div
            id="category-mega-menu-panel"
            className="mega-menu-panel"
            role="region"
            aria-label="Kategórie produktov"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <Container>
              <CategoryMegaPanel
                categories={categories}
                activeHandle={activeHandle}
                onCategoryHover={handleCategoryHover}
                onNavigate={handleNavigate}
              />
            </Container>
          </div>
        </>
      )}
    </div>
  )
}
