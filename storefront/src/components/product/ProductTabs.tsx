'use client'

import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/utils'
import { useStorefrontTheme } from '@/components/theme/StorefrontThemeProvider'
import { Accordion, type AccordionItem } from '@/components/noor/ui/Accordion'
import { useLocale, useT } from '@/components/i18n/LocaleProvider'
import { getProductShippingLines, t, type TranslationKey } from '@/lib/i18n/translate'

interface ProductTabsProps {
  descriptionHtml: string | null
  compositionHtml: string | null
}

type TabId = 'description' | 'composition' | 'shipping'

const TAB_KEYS: Record<TabId, TranslationKey> = {
  description: 'product.tab.description',
  composition: 'product.tab.composition',
  shipping: 'product.tab.shipping',
}

function renderTabContent(
  tabId: TabId,
  descriptionHtml: string | null,
  compositionHtml: string | null,
  shippingLines: string[],
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
        {shippingLines.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    )
  }

  return null
}

export default function ProductTabs({ descriptionHtml, compositionHtml }: ProductTabsProps) {
  const { theme } = useStorefrontTheme()
  const { locale } = useLocale()
  const translate = useT()
  const [isMobile, setIsMobile] = useState(false)

  const shippingLines = useMemo(() => getProductShippingLines(locale), [locale])

  const availableTabs = useMemo(() => {
    const tabs: TabId[] = []
    if (descriptionHtml) tabs.push('description')
    if (compositionHtml) tabs.push('composition')
    tabs.push('shipping')
    return tabs.map((id) => ({ id, label: translate(TAB_KEYS[id]) }))
  }, [descriptionHtml, compositionHtml, translate])

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

  const tabsAria = t('product.tabsAria', locale)

  if (theme === 'noor' && isMobile) {
    const accordionItems: AccordionItem[] = availableTabs.map((tab) => ({
      id: tab.id,
      title: tab.label,
      content: renderTabContent(tab.id, descriptionHtml, compositionHtml, shippingLines),
    }))

    return (
      <section className="mt-12" aria-label={tabsAria}>
        <Accordion items={accordionItems} allowMultiple />
      </section>
    )
  }

  return (
    <section className="mt-12" aria-label={tabsAria}>
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
          {renderTabContent(tab.id, descriptionHtml, compositionHtml, shippingLines)}
        </div>
      ))}
    </section>
  )
}
