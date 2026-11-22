/* global importScripts, self, caches */
importScripts('./precache.js')

const prefix = 'sila-world-'
const cacheName = prefix + self.SILA_BUILD
const url = (path) => new URL(path, self.registration.scope).href
const precache = new Set(self.SILA_FILES.map(url))

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) =>
    cache.addAll([...precache].map((file) => new Request(file, { cache: 'reload' }))),
  ))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith(prefix) && name !== cacheName)
      .map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  const location = new URL(request.url)
  const entry = url('index.html')
  const key = request.mode === 'navigate' &&
    (location.pathname === new URL(url('./')).pathname || location.pathname === new URL(entry).pathname)
    ? entry : request.url
  if (!precache.has(key)) return
  event.respondWith(caches.open(cacheName).then(async (cache) =>
    (await cache.match(key)) ?? fetch(request),
  ))
})
