import { BRAND_COPY } from '@/lib/brand'

interface BrandPageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  centered?: boolean
  className?: string
}

export default function BrandPageHeader({
  eyebrow = BRAND_COPY.tagline,
  title,
  subtitle,
  centered = true,
  className = '',
}: BrandPageHeaderProps) {
  const alignClass = centered ? 'text-center' : 'text-left'

  return (
    <header className={`mb-8 md:mb-12 ${alignClass} ${className}`}>
      <p className="section-label">{eyebrow}</p>
      <h1 className="section-heading mb-4">{title}</h1>
      {subtitle && (
        <p className={`text-lg text-(--color-text-muted) max-w-2xl ${centered ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </header>
  )
}
