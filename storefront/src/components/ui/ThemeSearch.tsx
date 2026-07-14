'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { SearchDrawerTrigger } from '@/components/noor/ui'

interface ThemeSearchProps {
  className?: string
  pillClassName?: string
  children?: ReactNode
  variant?: 'icon' | 'pill'
  'aria-label'?: string
}

export function ThemeSearch({
  className,
  pillClassName = 'search-pill no-underline w-full',
  children,
  variant = 'icon',
  'aria-label': ariaLabel = 'Vyhľadávanie',
}: ThemeSearchProps) {
  const { theme } = useStorefrontTheme()

  const icon = children ?? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={variant === 'pill' ? 2 : 1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )

  if (theme === 'noor') {
    if (variant === 'pill') {
      return (
        <SearchDrawerTrigger className={pillClassName} aria-label={ariaLabel}>
          {icon}
          <span>Hľadať produkty...</span>
        </SearchDrawerTrigger>
      )
    }

    return (
      <SearchDrawerTrigger id="search-button" className={className} aria-label={ariaLabel}>
        {icon}
      </SearchDrawerTrigger>
    )
  }

  if (variant === 'pill') {
    return (
      <Link href="/vyhladavanie" className={pillClassName} aria-label={ariaLabel}>
        {icon}
        <span>Hľadať produkty...</span>
      </Link>
    )
  }

  return (
    <Link href="/vyhladavanie" id="search-button" className={className} aria-label={ariaLabel}>
      {icon}
    </Link>
  )
}
