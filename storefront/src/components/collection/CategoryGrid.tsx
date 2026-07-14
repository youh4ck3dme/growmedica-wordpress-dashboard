'use client'

import Link from 'next/link'
import { m, useReducedMotion } from 'framer-motion'
import type { NavCollectionItem } from '@/lib/catalog/nav'
import { cn } from '@/lib/utils'

interface CategoryGridProps {
  categories: NavCollectionItem[]
  className?: string
}

export function CategoryGrid({ categories, className }: CategoryGridProps) {
  const reduceMotion = useReducedMotion()

  if (categories.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'category-grid-premium grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4',
        className,
      )}
      role="list"
    >
      {categories.map((category) => (
        <m.div
          key={category.handle}
          role="listitem"
          className="h-full"
          whileHover={
            reduceMotion
              ? undefined
              : {
                  scale: 1.03,
                }
          }
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 28,
          }}
        >
          <Link
            href={category.href}
            className="category-grid-premium__card group flex h-full flex-col items-center justify-center text-center"
          >
            {category.icon ? (
              <span className="category-grid-premium__icon" aria-hidden="true">
                {category.icon}
              </span>
            ) : null}
            <h3 className="category-grid-premium__title">{category.title}</h3>
          </Link>
        </m.div>
      ))}
    </div>
  )
}
