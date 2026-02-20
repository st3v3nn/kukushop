const CACHE_NAME = 'speedy-bites-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-32x32.png',
];

// Install: cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: bypass cache for API, JS/CSS bundles, and non-http protocols
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // CRITICAL FIX: Only handle http/https protocols 
    // This avoids errors with chrome-extension:// and other non-standard schemes
    if (!url.protocol.startsWith('http')) return;

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // API requests: network only (don't cache API data)
    if (url.pathname.startsWith('/api/')) return;

    // Never cache JS or CSS bundles — they change on every build via content hashing
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) return;

    // Static assets (HTML, images, fonts): Network-first with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache valid successful responses from our origin
                if (response && response.status === 200 && url.origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Network failed — try cache
                return caches.match(event.request);
            })
    );
});

// Push notification handler
self.addEventListener('push', (event) => {
    let data = { title: 'Kuku ni Sisi', body: 'New update received!', icon: '/icon-192x192.png' };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/icon-192x192.png',
            badge: '/favicon-32x32.png',
            tag: data.tag || 'order-update',
            data: data.url || '/',
        })
    );
});
