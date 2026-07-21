import { cn } from '@/lib/utils'
import type { StorefrontIconProps } from './types'

export function IconBasket({ size = 20, className, ...props }: StorefrontIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
      {...props}
    >
      <path d="M8.5 10V6.75a3.5 3.5 0 0 1 7 0V10" />
      <path d="M7 10h10l-1.15 8.25H8.15L7 10z" />
      <path d="M9 13.5v4M12 13.5v4M15 13.5v4" />
      <path d="M8.25 16h7.5" />
    </svg>
  )
}
