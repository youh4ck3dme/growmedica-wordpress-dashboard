import { defaultCache, PAGES_CACHE_NAME } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// #region agent log
function swDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
): void {
  fetch('http://127.0.0.1:7665/ingest/fdafea1d-933e-4c86-be00-955b77b5ac22', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c2eadd' },
    body: JSON.stringify({
      sessionId: 'c2eadd',
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
      runId: 'post-fix',
    }),
  }).catch(() => {})
}
// #endregion

const OVERRIDDEN_CACHE_NAMES = new Set([
  PAGES_CACHE_NAME.html,
  PAGES_CACHE_NAME.rsc,
  PAGES_CACHE_NAME.rscPrefetch,
  'apis',
])

const filteredDefaultCache = defaultCache.filter((entry) => {
  const cacheName = (entry.handler as { cacheName?: string }).cacheName
  return !cacheName || !OVERRIDDEN_CACHE_NAMES.has(cacheName)
})

function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  runtimeCaching: [
    {
      matcher: ({ url, request }) => {
        const match =
          url.pathname.startsWith('/api/dashboard') || isDashboardPath(url.pathname)
        if (match) {
          // #region agent log
          swDebugLog(
            'sw.ts:dashboard-network-only',
            'dashboard routed to NetworkOnly',
            { pathname: url.pathname, mode: request.mode, method: request.method },
            'A',
          )
          // #endregion
        }
        return match
      },
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin && request.mode === 'navigate' && !isDashboardPath(url.pathname),
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE_NAME.html,
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }) =>
        sameOrigin && request.headers.get('RSC') === '1' && !pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
      handler: new NetworkOnly(),
    },
    ...filteredDefaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher({ request }) {
          const pathname = new URL(request.url).pathname
          return request.mode === 'navigate' && !isDashboardPath(pathname)
        },
      },
      {
        url: '/offline',
        matcher({ request }) {
          const pathname = new URL(request.url).pathname
          return request.mode === 'navigate' && !isDashboardPath(pathname)
        },
      },
    ],
  },
})

serwist.setCatchHandler(async ({ request }) => {
  const pathname = new URL(request.url).pathname
  if (isDashboardPath(pathname) || pathname.startsWith('/api/dashboard')) {
    // #region agent log
    swDebugLog(
      'sw.ts:catchHandler',
      'dashboard bypass catch handler — return network error passthrough',
      { pathname, mode: request.mode, method: request.method },
      'B',
    )
    // #endregion
    return fetch(request)
  }
  if (request.mode === 'navigate') {
    return (
      (await serwist.matchPrecache('/offline.html')) ??
      (await serwist.matchPrecache('/offline')) ??
      Response.error()
    )
  }
  return Response.error()
})

serwist.addEventListeners()

// #region agent log
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/api/dashboard')) {
    swDebugLog(
      'sw.ts:fetch-listener',
      'fetch event for dashboard',
      {
        pathname: url.pathname,
        mode: event.request.mode,
        method: event.request.method,
        rsc: event.request.headers.get('RSC'),
      },
      url.pathname.startsWith('/api/dashboard') ? 'D' : 'A',
    )
  }
})
// #endregion
