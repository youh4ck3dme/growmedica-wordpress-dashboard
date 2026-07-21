import { cn } from '@/lib/utils'
import type { StorefrontIconProps } from './types'

type IconHeartProps = StorefrontIconProps & {
  filled?: boolean
}

export function IconHeart({ size = 20, filled = false, className, ...props }: IconHeartProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
      {...props}
    >
      <path d="M12 20.5s-7-4.35-7-9.5a4 4 0 0 1 7-2.45A4 4 0 0 1 19 11c0 5.15-7 9.5-7 9.5z" />
    </svg>
  )
}
