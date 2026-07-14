
import type { Money } from '@/lib/shopify/types'
import { formatMoney, getDiscountPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PriceProps {
  price: Money
  compareAtPrice?: Money | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Price({ price, compareAtPrice, className, size = 'md' }: PriceProps) {
  const discount = compareAtPrice ? getDiscountPercentage(price, compareAtPrice) : null
  const hasDiscount = discount !== null && discount > 0

  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size]

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span
        className={cn(
          'font-semibold tabular-nums',
          sizeClass,
          hasDiscount ? 'text-(--color-error)' : 'text-(--color-text)'
        )}
      >
        {formatMoney(price)}
      </span>

      {hasDiscount && compareAtPrice && (
        <>
          <span
            className={cn(
              'text-(--color-text-light) line-through tabular-nums',
              size === 'lg' ? 'text-base' : 'text-sm'
            )}
          >
            {formatMoney(compareAtPrice)}
          </span>
          <span className="badge badge-warning text-xs">-{discount}%</span>
        </>
      )}
    </div>
  )
}
