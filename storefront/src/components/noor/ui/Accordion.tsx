'use client'

import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  className?: string
}

export function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState<string[]>([])

  function toggle(id: string) {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id)
      }
      return allowMultiple ? [...prev, id] : [id]
    })
  }

  return (
    <div className={cn('noor-accordion', className)}>
      {items.map((item, index) => {
        const isOpen = openIds.includes(item.id)
        const panelId = `${baseId}-panel-${index}`
        const triggerId = `${baseId}-trigger-${index}`

        return (
          <div key={item.id} className="noor-accordion__item">
            <h3 className="noor-accordion__heading">
              <button
                type="button"
                id={triggerId}
                className="noor-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span>{item.title}</span>
                <span className="noor-accordion__icon" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="noor-accordion__panel"
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
