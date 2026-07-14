'use client'

import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { Accordion, type AccordionItem } from '@/components/noor/ui/Accordion'

interface ThemeAccordionProps {
  items: AccordionItem[]
  className?: string
  allowMultiple?: boolean
}

export function ThemeAccordion({ items, className, allowMultiple }: ThemeAccordionProps) {
  const { theme } = useStorefrontTheme()

  if (theme === 'noor') {
    return <Accordion items={items} className={className} allowMultiple={allowMultiple} />
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-xl border border-(--color-border) bg-(--color-surface-2)"
          >
            <h3 className="text-lg font-bold text-(--color-text) mb-3">{item.title}</h3>
            <div className="text-(--color-text-muted) leading-relaxed">{item.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { AccordionItem }
