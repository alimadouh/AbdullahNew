const CACHE_NAME = 'pcis-v1'
const DATA_CACHE = 'pcis-data-v1'

// App shell files to pre-cache (Vite hashed assets get cached at runtime)
const PRECACHE = [
  '/',
  '/logo.png',
  '/kw.png',
  '/manifest.json',
]

// ── Install: pre-cache app shell ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: clean old caches ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch strategy ──
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Skip non-GET requests (admin updates, auth)
  if (e.request.method !== 'GET') return

  // API data requests: network-first, fallback to cache
  if (url.pathname.includes('/.netlify/functions/data')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(DATA_CACHE).then((cache) => cache.put(e.request, clone))
          return res
        })
        .catch(() => caches.match(e.request))
    )
    return
  }

  // Everything else (app shell, assets): cache-first, fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        // Cache successful responses for assets
        if (res.ok && (url.origin === self.location.origin)) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return res
      })
    }).catch(() => {
      // Offline fallback for navigation requests
      if (e.request.mode === 'navigate') {
        return caches.match('/')
      }
    })
  )
})
