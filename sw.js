// Service Worker for Familiens Kokebok v4.5.3
const CACHE_NAME = 'kokebok-v4.5.3';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=4.5.2',
    './app.js?v=4.5.2',
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

// ===== PUSH NOTIFICATIONS (v4.1.0) =====

// Handle push notification events
self.addEventListener('push', (event) => {
    console.log('Push received:', event);
    
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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    // Default URL to open
    let targetUrl = '/';
    
    // Check if notification has specific data
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
    
    // Handle action buttons
    if (event.action) {
        switch (event.action) {
            case 'view':
                // Use targetUrl set above
                break;
            case 'dismiss':
                return; // Just close the notification
            case 'accept':
                // Handle friend request accept - will need to be handled by app
                targetUrl = '/?view=friends&action=accept&id=' + (event.notification.data?.requestId || '');
                break;
        }
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus().then(() => {
                            // Post message to client to navigate
                            client.postMessage({
                                type: 'NOTIFICATION_CLICK',
                                url: targetUrl,
                                data: event.notification.data
                            });
                        });
                    }
                }
                // If app is not open, open it
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
    
    // Track notification dismissed (could be sent to analytics)
    // This is useful for understanding user engagement
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('Push subscription changed');
    
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
            .then((subscription) => {
                // Send new subscription to server
                // This would require a backend to store the subscription
                console.log('New subscription:', subscription);
            })
    );
});
