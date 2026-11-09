/**
 * SHREEJI CLIENT ORDER MANAGEMENT SYSTEM
 * Progressive Web App (PWA) Service Worker
 * 
 * SECURITY COMPLIANCE RULE:
 * NEVER cache private order API responses, authentication tokens,
 * or confidential client medical requisition data.
 * ONLY cache static application shell assets for offline UI reliability.
 */

const CACHE_NAME = 'shreeji-shell-v1';
const STATIC_ASSETS = [
  './index.html',
  './assets/style.css',
  './assets/app.js',
  './manifest.webmanifest'
];

// Install: Cache Shell Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static application shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Clearing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first or Network-only for API, Cache-first for Static Shell
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // CRITICAL RULE: Bypasses cache completely for all API / Webhook endpoints & dynamic requests
  if (
    request.method !== 'GET' ||
    url.pathname.includes('/webhook') ||
    url.pathname.includes('/shreeji/') ||
    request.headers.has('authorization')
  ) {
    // Network only - Never store confidential clinical orders in browser public cache
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first strategy for static app shell files
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        // Return original network response
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
