import Image from 'next/image'
import { BRAND_COPY } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  iconSize?: number
  className?: string
}

/** @deprecated Prefer Logo mark image; kept for rare SVG-only callers. */
export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/logo-mark.webp"
      alt=""
      width={size}
      height={size}
      className="storefront-logo__mark"
      unoptimized
    />
  )
}

export default function Logo({
  variant = 'light',
  iconSize = 36,
  className = '',
}: LogoProps) {
  return (
    <div
      className={cn(
        'storefront-logo flex items-center gap-2.5',
        variant === 'dark' ? 'storefront-logo--dark' : 'storefront-logo--light',
        className,
      )}
    >
      <Image
        src="/logo-mark.webp"
        alt=""
        width={iconSize}
        height={iconSize}
        className="storefront-logo__mark shrink-0"
        unoptimized
      />
      <span
        className="storefront-logo__wordmark text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap leading-none"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        <span className="storefront-logo__grow">Grow</span>
        <span className="storefront-logo__accent">Medica</span>
        <span className="storefront-logo__tld">
          {BRAND_COPY.siteName.includes('.')
            ? BRAND_COPY.siteName.slice(BRAND_COPY.siteName.indexOf('.'))
            : '.cz'}
        </span>
      </span>
    </div>
  )
}
