'use client'

import { ThemeAccordion } from '@/components/ui/ThemeAccordion'

interface FaqItem {
  q: string
  a: string
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <ThemeAccordion
      allowMultiple
      items={items.map((item, index) => ({
        id: `faq-${index}`,
        title: item.q,
        content: <p className="m-0">{item.a}</p>,
      }))}
    />
  )
}
