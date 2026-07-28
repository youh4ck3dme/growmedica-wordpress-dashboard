'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { m } from 'framer-motion'
import Logo from '@/components/ui/Logo'
import { useT } from '@/components/i18n/LocaleProvider'
import { useHydrationSafeReducedMotion } from '@/hooks/useHydrationSafeReducedMotion'
import {
  acceptAllConsent,
  createConsent,
  dispatchConsentEvent,
  necessaryOnlyConsent,
  readConsent,
  writeConsent,
  type CookieConsent,
} from '@/lib/cookie-consent'
import { cn } from '@/lib/utils'

export default function CookieConsentBanner() {
  const t = useT()
  const titleId = useId()
  const reduceMotion = useHydrationSafeReducedMotion()
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    const show = !existing
    setVisible(show)
    setReady(true)
    dispatchConsentEvent({ consent: existing, visible: show })
  }, [])

  function persist(consent: CookieConsent) {
    writeConsent(consent)
    setVisible(false)
    setCustomizing(false)
  }

  if (!ready || !visible) return null

  return (
    <m.div
      className="cookie-consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-testid="cookie-consent-banner"
      initial={reduceMotion ? false : { y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cookie-consent__inner">
        <div className="cookie-consent__brand" aria-hidden="true">
          <div className="cookie-consent__logo-pill">
            <Logo iconSize={28} className="cookie-consent__logo" />
          </div>
        </div>

        <div className="cookie-consent__copy">
          <h2 id={titleId} className="cookie-consent__title">
            {t('cookies.title')}
          </h2>
          <p className="cookie-consent__body">{t('cookies.body')}</p>
          <p className="cookie-consent__note">{t('cookies.retention')}</p>
          <p className="cookie-consent__links">
            {t('cookies.settingsHint')}{' '}
            <button
              type="button"
              className="cookie-consent__text-link"
              onClick={() => setCustomizing(true)}
            >
              {t('cookies.settingsLink')}
            </button>
          </p>
          <p className="cookie-consent__links">
            {t('cookies.policyHint')}{' '}
            <Link href="/ochrana-osobnych-udajov" className="cookie-consent__text-link">
              {t('cookies.policyLink')}
            </Link>
          </p>
          <button
            type="button"
            className="cookie-consent__details"
            onClick={() => setCustomizing((prev) => !prev)}
            aria-expanded={customizing}
          >
            {customizing ? t('cookies.hideDetails') : t('cookies.showDetails')}
          </button>

          {customizing && (
            <div className="cookie-consent__customize" data-testid="cookie-consent-customize-panel">
              <label className="cookie-consent__toggle">
                <span>
                  <strong>{t('cookies.cat.necessary')}</strong>
                  <span className="cookie-consent__toggle-desc">{t('cookies.cat.necessaryDesc')}</span>
                </span>
                <input type="checkbox" checked disabled readOnly aria-label={t('cookies.cat.necessary')} />
              </label>
              <label className="cookie-consent__toggle">
                <span>
                  <strong>{t('cookies.cat.analytics')}</strong>
                  <span className="cookie-consent__toggle-desc">{t('cookies.cat.analyticsDesc')}</span>
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  aria-label={t('cookies.cat.analytics')}
                />
              </label>
              <label className="cookie-consent__toggle">
                <span>
                  <strong>{t('cookies.cat.marketing')}</strong>
                  <span className="cookie-consent__toggle-desc">{t('cookies.cat.marketingDesc')}</span>
                </span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  aria-label={t('cookies.cat.marketing')}
                />
              </label>
              <button
                type="button"
                className="cookie-consent__btn cookie-consent__btn--primary"
                data-testid="cookie-consent-save"
                onClick={() => persist(createConsent({ analytics, marketing }))}
              >
                {t('cookies.save')}
              </button>
            </div>
          )}
        </div>

        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--primary"
            data-testid="cookie-consent-accept-all"
            onClick={() => persist(acceptAllConsent())}
          >
            {t('cookies.acceptAll')}
          </button>
          <button
            type="button"
            className={cn('cookie-consent__btn cookie-consent__btn--secondary')}
            data-testid="cookie-consent-customize"
            onClick={() => setCustomizing(true)}
          >
            {t('cookies.customize')}
          </button>
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--secondary"
            data-testid="cookie-consent-necessary"
            onClick={() => persist(necessaryOnlyConsent())}
          >
            {t('cookies.necessaryOnly')}
          </button>
        </div>
      </div>
    </m.div>
  )
}
