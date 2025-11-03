// Minimal Service Worker for PWA support
// Version 1.0.0

const CACHE_NAME = 'ionia-lms-v1';
const urlsToCache = [
  '/',
  '/login',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache resources one by one to avoid failing on any single one
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null; // Continue caching other resources
            })
          )
        );
      })
      .then(() => {
        console.log('Cache installation completed');
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip caching API requests, they should always go to network
  if (event.request.url.includes('/api/')) {
    return; // Let browser handle API requests normally
  }
  
  // Skip caching RSC (React Server Components) requests
  if (event.request.url.includes('?rsc=')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // If network fails, return offline page if available
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

