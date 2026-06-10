// Service Worker for Familiens Kokebok v5.0.0
// Strategi: network-first for appens egne filer (HTML/JS/CSS), cache som offline-fallback.
// Dette sikrer at brukere alltid får nyeste kode når de er på nett.
const CACHE_NAME = 'kokebok-v5.0.0';
const PRECACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './firebase-config.js',
    './js/01-core.js',
    './js/02-navigation-dashboard.js',
    './js/03-recipes.js',
    './js/04-books-categories.js',
    './js/05-search-mealplan.js',
    './js/06-shopping-timer.js',
    './js/07-gamification.js',
    './js/08-social-push.js',
    './js/09-equipment-pantry.js',
    './js/10-prices-ai-scanner.js',
    './js/11-premium-tools.js',
    './js/12-calculators-planners.js',
    './js/13-nutrition-voice-stats.js',
    './js/14-guides-converters.js',
    './js/15-collections-misc.js'
];

// Install - precache app-skallet (feiler ikke installasjonen om enkeltfiler mangler)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
            .then(() => self.skipWaiting())
    );
});

// Activate - rydd gamle cacher og ta kontroll umiddelbart
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch - network-first for egne filer, nettverk for alt annet
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Firestore, Google APIs osv. går alltid rett på nett
    if (url.origin !== location.origin || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(async () => {
                // Offline: bruk cache (ignorer ?v=-parametre slik at gamle versjonsnumre treffer)
                const cached = await caches.match(event.request, { ignoreSearch: true });
                if (cached) return cached;
                if (event.request.mode === 'navigate') {
                    const shell = await caches.match('./index.html', { ignoreSearch: true });
                    if (shell) return shell;
                }
                return Response.error();
            })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ===== PUSH NOTIFICATIONS =====

self.addEventListener('push', (event) => {
    let data = {
        title: 'Familiens Kokebok',
        body: 'Du har en ny melding',
        icon: './icons/icon-192.svg',
        badge: './icons/icon-72.svg',
        tag: 'kokebok-notification'
    };

    try {
        if (event.data) {
            const payload = event.data.json();
            data = { ...data, ...payload };
        }
    } catch (e) {
        console.error('Error parsing push data:', e);
    }

    const options = {
        body: data.body,
        icon: data.icon || './icons/icon-192.svg',
        badge: data.badge || './icons/icon-72.svg',
        tag: data.tag || 'kokebok-notification',
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
        vibrate: [100, 50, 100]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    let targetUrl = '/';

    if (event.notification.data) {
        if (event.notification.data.url) {
            targetUrl = event.notification.data.url;
        } else if (event.notification.data.type === 'friend_request') {
            targetUrl = '/?view=friends';
        } else if (event.notification.data.type === 'shared_recipe') {
            targetUrl = '/?view=friends&tab=received';
        } else if (event.notification.data.type === 'expiring_items') {
            targetUrl = '/?view=pantry';
        }
    }

    if (event.action) {
        switch (event.action) {
            case 'view':
                break;
            case 'dismiss':
                return;
            case 'accept':
                targetUrl = '/?view=friends&action=accept&id=' + (event.notification.data?.requestId || '');
                break;
        }
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus().then(() => {
                            client.postMessage({
                                type: 'NOTIFICATION_CLICK',
                                url: targetUrl,
                                data: event.notification.data
                            });
                        });
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

self.addEventListener('pushsubscriptionchange', (event) => {
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
            .then((subscription) => {
                console.log('New subscription:', subscription);
            })
    );
});
