import { defaultCache, PAGES_CACHE_NAME } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

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
      matcher: ({ url }) =>
        url.pathname.startsWith('/api/dashboard') || isDashboardPath(url.pathname),
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
