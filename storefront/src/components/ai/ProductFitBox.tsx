'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ProductFitOutput } from '@/lib/ai/schemas'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n/LocaleProvider'
import type { TranslationKey } from '@/lib/i18n/translate'

const fitBoxClasses: Record<ProductFitOutput['fit'], string> = {
  good: 'bg-(--color-surface-2) border-(--color-success) text-(--color-success)',
  maybe: 'bg-(--color-surface-2) border-(--color-warning) text-(--color-warning)',
  not_recommended: 'bg-(--color-surface-2) border-(--color-error) text-(--color-error)',
}

const fitLabelKeys: Record<ProductFitOutput['fit'], TranslationKey> = {
  good: 'fit.good',
  maybe: 'fit.maybe',
  not_recommended: 'fit.notRecommended',
}

interface ProductFitBoxProps {
  handle: string
  productTitle: string
}

export function ProductFitBox({ handle, productTitle }: ProductFitBoxProps) {
  const t = useT()
  const [userContext, setUserContext] = useState('')
  const [fitData, setFitData] = useState<ProductFitOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckFit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userContext.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/product-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, userContext: userContext.trim() }),
      })

      const data = (await response.json()) as ProductFitOutput & { error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? t('fit.error'))
      }

      setFitData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fit.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 p-4 border border-(--color-border) rounded-lg bg-(--color-surface-2)">
      <h3 className="text-lg font-semibold mb-1 text-(--color-text)">
        {t('fit.title', { title: productTitle })}
      </h3>
      <p className="text-sm text-(--color-text-muted) mb-4">
        {t('fit.subtitle')} {t('finder.disclaimer')}
      </p>

      <form onSubmit={handleCheckFit} className="space-y-4">
        <textarea
          placeholder={t('fit.placeholder')}
          value={userContext}
          onChange={(event) => setUserContext(event.target.value)}
          disabled={loading}
          className={cn(
            'w-full p-3 border border-(--color-border) rounded-lg min-h-[100px]',
            'text-(--color-text) bg-(--color-surface)',
            'placeholder:text-(--color-text-muted)',
            'focus:outline-none focus:ring-2 focus:ring-(--color-primary)',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y',
          )}
          aria-label={t('fit.inputAria')}
        />
        <Button
          type="submit"
          variant="secondary"
          size="md"
          isLoading={loading}
          disabled={!userContext.trim()}
          fullWidth
        >
          {loading ? t('fit.loading') : t('fit.submit')}
        </Button>
      </form>

      {loading && (
        <div className="mt-4 space-y-2" aria-live="polite">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 border border-(--color-error) rounded-lg bg-(--color-surface-2) text-(--color-error)"
        >
          {error}
        </div>
      )}

      {fitData && !loading && (
        <div className="mt-4 space-y-4">
          <div className={cn('p-3 rounded-lg border', fitBoxClasses[fitData.fit])}>
            <p className="font-medium">{t(fitLabelKeys[fitData.fit])}</p>
            <p className="mt-1 text-(--color-text)">{fitData.shortAnswer}</p>
          </div>

          {fitData.bestFor.length > 0 && (
            <div>
              <h4 className="font-medium text-(--color-text)">{t('fit.bestFor')}</h4>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-(--color-text-muted)">
                {fitData.bestFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {fitData.notIdealFor.length > 0 && (
            <div>
              <h4 className="font-medium text-(--color-text)">{t('fit.notIdealFor')}</h4>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-(--color-text-muted)">
                {fitData.notIdealFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {fitData.howToUse && (
            <div>
              <h4 className="font-medium text-(--color-text)">{t('fit.howToUse')}</h4>
              <p className="mt-1 text-(--color-text-muted)">{fitData.howToUse}</p>
            </div>
          )}

          <p className="text-xs text-(--color-text-muted) italic">{fitData.safeDisclaimer}</p>
        </div>
      )}
    </div>
  )
}
