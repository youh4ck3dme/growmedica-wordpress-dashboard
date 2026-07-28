'use client'

import { useT } from '@/components/i18n/LocaleProvider'

interface BrandPageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
}

export default function BrandPageHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  className = '',
}: BrandPageHeaderProps) {
  const t = useT()
  const alignClass = centered ? 'text-center' : 'text-left'
  const resolvedEyebrow = eyebrow ?? t('brand.tagline')

  return (
    <header className={`mb-8 md:mb-12 ${alignClass} ${className}`}>
      <p className="section-label">{resolvedEyebrow}</p>
      <h1 className="section-heading mb-4">{title}</h1>
      {subtitle && (
        <p className={`text-lg text-(--color-text-muted) max-w-2xl ${centered ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </header>
  )
}
