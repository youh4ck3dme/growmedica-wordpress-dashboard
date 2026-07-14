import { BRAND_COPY } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  iconSize?: number
  className?: string
}

export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="crossMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8ECF0" />
          <stop offset="50%" stopColor="#B8C4CE" />
          <stop offset="100%" stopColor="#8A9BAA" />
        </linearGradient>
        <linearGradient id="leafGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6DD4A8" />
          <stop offset="100%" stopColor="#35C79A" />
        </linearGradient>
      </defs>
      <rect x="18" y="8" width="12" height="32" rx="3" fill="url(#crossMetal)" />
      <rect x="8" y="18" width="32" height="12" rx="3" fill="url(#crossMetal)" />
      <path
        d="M30 28C30 28 38 26 40 32C42 38 36 42 32 40C28 38 26 34 28 30C29 28.5 30 28 30 28Z"
        fill="url(#leafGreen)"
      />
      <path
        d="M32 30C32 30 34 34 33 37"
        stroke="white"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
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
      <LogoIcon size={iconSize} />
      <span
        className="storefront-logo__wordmark text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap leading-none"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
        aria-label={BRAND_COPY.siteName}
      >
        <span className="storefront-logo__grow">Grow</span>
        <span className="storefront-logo__accent">Medica</span>
        <span className="storefront-logo__tld">.sk</span>
      </span>
    </div>
  )
}
