// Service Worker for Familiens Kokebok v3.1
const CACHE_NAME = 'kokebok-v3.1';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=3.1',
    './app.js?v=3.1',
    './firebase-config.js',
    './manifest.json'
];

// Install - Cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// Fetch - Network first for API/Firestore, cache for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Let network-only for Firestore, Google APIs, etc.
    if (url.hostname.includes('firestore') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('firebase')) {
        return;
    }
    
    // Cache-first for same-origin requests
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then((cached) => {
                    // Return cached version or fetch from network
                    const fetched = fetch(event.request)
                        .then((response) => {
                            // Cache successful responses
                            if (response && response.status === 200) {
                                const clone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => cache.put(event.request, clone));
                            }
                            return response;
                        })
                        .catch(() => cached);
                    
                    return cached || fetched;
                })
        );
    }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
