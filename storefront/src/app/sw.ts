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
      matcher: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
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
          return request.mode === 'navigate'
        },
      },
      {
        url: '/offline',
        matcher({ request }) {
          return request.mode === 'navigate'
        },
      },
    ],
  },
})

serwist.setCatchHandler(async ({ request }) => {
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
