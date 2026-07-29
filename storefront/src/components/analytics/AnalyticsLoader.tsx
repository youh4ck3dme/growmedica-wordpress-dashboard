'use client'

import { useEffect } from 'react'
import {
  CONSENT_EVENT,
  readConsent,
  type ConsentEventDetail,
  type CookieConsent,
} from '@/lib/cookie-consent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || ''
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID?.trim() || ''
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || ''

function injectScript(id: string, src: string, inline?: string) {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  if (inline) {
    script.text = inline
  } else {
    script.async = true
    script.src = src
  }
  document.head.appendChild(script)
}

function loadAnalytics(consent: CookieConsent) {
  if (!consent.analytics && !consent.marketing) return

  if (consent.analytics && GTM_ID) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    injectScript('gm-gtm', `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`)
  }

  if (consent.analytics && GA4_ID && !GTM_ID) {
    injectScript('gm-ga4', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`)
    injectScript(
      'gm-ga4-config',
      '',
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID.replace(/'/g, "\\'")}');`,
    )
  }

  if (consent.marketing && META_PIXEL_ID) {
    injectScript(
      'gm-meta-pixel',
      '',
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID.replace(/'/g, "\\'")}');fbq('track','PageView');`,
    )
  }
}

/**
 * Loads GTM / GA4 / Meta Pixel only after cookie consent.
 * Set NEXT_PUBLIC_GTM_ID and/or NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_META_PIXEL_ID.
 */
export function AnalyticsLoader() {
  useEffect(() => {
    if (!GTM_ID && !GA4_ID && !META_PIXEL_ID) return

    function apply(consent: CookieConsent | null) {
      if (!consent) return
      loadAnalytics(consent)
    }

    apply(readConsent())

    function onConsent(event: Event) {
      const detail = (event as CustomEvent<ConsentEventDetail>).detail
      apply(detail?.consent ?? null)
    }

    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_EVENT, onConsent)
  }, [])

  if (!GTM_ID) return null

  // noscript iframe for GTM when consent already granted is handled client-side only
  return null
}
