'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/utils'
import { SHIPPING_TAB_CONTENT } from '@/lib/brand'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { Accordion, type AccordionItem } from '@/components/noor/ui/Accordion'

interface ProductTabsProps {
  descriptionHtml: string | null
  compositionHtml: string | null
}

type TabId = 'description' | 'composition' | 'shipping'

const TABS: { id: TabId; label: string }[] = [
  { id: 'description', label: 'Popis produktu' },
  { id: 'composition', label: 'Zloženie a účinné látky' },
  { id: 'shipping', label: 'Doprava a vrátenie' },
]

function renderTabContent(
  tabId: TabId,
  descriptionHtml: string | null,
  compositionHtml: string | null,
) {
  if (tabId === 'description' && descriptionHtml) {
    return (
      <div
        className="product-description max-w-3xl"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(descriptionHtml) }}
      />
    )
  }

  if (tabId === 'composition' && compositionHtml) {
    return (
      <div
        className="product-description max-w-3xl"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(compositionHtml) }}
      />
    )
  }

  if (tabId === 'shipping') {
    return (
      <div className="product-description max-w-3xl space-y-3 text-(--color-text-muted)">
        {SHIPPING_TAB_CONTENT.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    )
  }

  return null
}

export default function ProductTabs({ descriptionHtml, compositionHtml }: ProductTabsProps) {
  const { theme } = useStorefrontTheme()
  const [isMobile, setIsMobile] = useState(false)

  const availableTabs = TABS.filter((tab) => {
    if (tab.id === 'description') return Boolean(descriptionHtml)
    if (tab.id === 'composition') return Boolean(compositionHtml)
    return true
  })

  const [active, setActive] = useState<TabId>(availableTabs[0]?.id ?? 'shipping')

  useEffect(() => {
    function update() {
      setIsMobile(window.matchMedia('(max-width: 1023px)').matches)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (availableTabs.length === 0) return null

  if (theme === 'noor' && isMobile) {
    const accordionItems: AccordionItem[] = availableTabs.map((tab) => ({
      id: tab.id,
      title: tab.label,
      content: renderTabContent(tab.id, descriptionHtml, compositionHtml),
    }))

    return (
      <section className="mt-12" aria-label="Detailné informácie o produkte">
        <Accordion items={accordionItems} allowMultiple />
      </section>
    )
  }

  return (
    <section className="mt-12" aria-label="Detailné informácie o produkte">
      <div className="border-b border-(--color-border)">
        <div className="flex flex-wrap gap-1" role="tablist">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`product-tab-${tab.id}`}
              aria-selected={active === tab.id}
              aria-controls={`product-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px',
                active === tab.id
                  ? 'border-(--color-primary) text-(--color-primary-dark)'
                  : 'border-transparent text-(--color-text-muted) hover:text-(--color-text)',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {availableTabs.map((tab) => (
        <div
          key={tab.id}
          id={`product-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`product-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="py-6"
        >
          {renderTabContent(tab.id, descriptionHtml, compositionHtml)}
        </div>
      ))}
    </section>
  )
}
