/*
 * Service worker source. At build time, the `service-worker` plugin in
 * vite.config.ts fills in the two constants below and emits dist/sw.js:
 * PRECACHE_URLS lists every file of the build (hashed assets, HTML, manifest,
 * icons) and CACHE_VERSION is a hash of their contents, unique per build.
 */

const PRECACHE_URLS = __PRECACHE_URLS__
const CACHE_VERSION = __CACHE_VERSION__

const CACHE_PREFIX = 'smart-search-reader-'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`
const APP_SHELL_URL = PRECACHE_URLS.find((url) => url.endsWith('/index.html'))

// Cache the whole app up front, so it works offline after the first visit.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)))
})

// Drop caches of previous builds, then take control of open pages.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  event.respondWith(request.mode === 'navigate' ? networkFirst(request) : cacheFirst(request))
})

/** Pages: fresh from the network when online, the cached app shell when offline. */
async function networkFirst(request) {
  try {
    return await fetch(request)
  } catch {
    const cached = await caches.match(APP_SHELL_URL)
    return cached ?? Response.error()
  }
}

/** Assets: hashed file names never change content, so the cache is always right. */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }
  return response
}

// The page asks a waiting worker to take over when the user accepts an update.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
