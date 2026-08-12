import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist'
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
} from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const audioRangeBypass: RuntimeCaching = {
  matcher: ({ url, sameOrigin, request }) =>
    sameOrigin &&
    url.pathname === '/api/quran-audio' &&
    Boolean(request.headers.get('range')),
  handler: new NetworkOnly(),
}

const audioCache: RuntimeCaching = {
  matcher: ({ url, sameOrigin }) =>
    sameOrigin && url.pathname === '/api/quran-audio',
  handler: new CacheFirst({
    cacheName: 'quran-audio-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 32,
        purgeOnQuotaError: true,
      }),
    ],
  }),
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: { cleanupOutdatedCaches: true },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    audioRangeBypass,
    audioCache, // must stay before defaultCache
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.mode === 'navigate' || request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()
