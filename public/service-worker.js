/**
 * FloraSonics Service Worker
 * Caches app assets with explicit audio cache eviction to stay under iOS disk limits
 * Implements LRU (Least Recently Used) eviction for audio assets (>50MB threshold)
 */

const CACHE_NAME = 'florasonics-v1';
const AUDIO_CACHE_NAME = 'florasonics-audio-v1';
const AUDIO_CACHE_LIMIT_MB = 50; // iOS disk cache limit
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/styles.css'
];

/**
 * Install: Pre-cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('Service Worker: Install error (non-fatal):', error.message);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

/**
 * Activate: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== AUDIO_CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Calculate cache size in bytes for a given cache name
 */
async function getCacheSizeBytes(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  let totalBytes = 0;
  for (const request of keys) {
    try {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalBytes += blob.size;
      }
    } catch (e) {
      // Skip entries that can't be measured
    }
  }
  
  return totalBytes;
}

/**
 * Get all cached entries sorted by last access time (LRU)
 * Oldest accessed entries are removed first
 */
async function getCacheEntriesByAccessTime(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  const entries = [];
  for (const request of keys) {
    try {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        const dateHeader = response.headers.get('date');
        const timestamp = dateHeader ? new Date(dateHeader).getTime() : Date.now();
        
        entries.push({
          request,
          size: blob.size,
          timestamp,
        });
      }
    } catch (e) {
      // Skip entries that can't be measured
    }
  }
  
  // Sort by timestamp (oldest first)
  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Evict least-recently-used audio entries until under limit
 */
async function evictAudioCache() {
  const limitBytes = AUDIO_CACHE_LIMIT_MB * 1024 * 1024;
  const currentSize = await getCacheSizeBytes(AUDIO_CACHE_NAME);
  
  if (currentSize <= limitBytes) {
    return; // Under limit, no eviction needed
  }
  
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const entries = await getCacheEntriesByAccessTime(AUDIO_CACHE_NAME);
  
  let freed = 0;
  for (const entry of entries) {
    if (currentSize - freed <= limitBytes * 0.8) {
      // Stop when we've freed enough (80% of limit)
      break;
    }
    
    try {
      await cache.delete(entry.request);
      freed += entry.size;
    } catch (e) {
      // Continue even if deletion fails
    }
  }
  
  console.log(`Service Worker: Evicted ${(freed / 1024 / 1024).toFixed(2)}MB from audio cache`);
}

/**
 * Fetch: Network-first for dynamic content, cache-first for static/audio
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Audio files: Cache-first with eviction policy
  if (url.pathname.match(/\.(mp3|wav|ogg|m4a|aac)$/i) || url.hostname.includes('unsplash')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          
          // Fetch from network and cache
          return fetch(request).then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Clone response before caching
            const responseToCache = response.clone();
            cache.put(request, responseToCache);
            
            // Evict if over limit
            evictAudioCache();
            
            return response;
          }).catch(() => {
            // Offline: return cached or offline page
            return cache.match(request) || caches.match('/offline.html');
          });
        });
      })
    );
    return;
  }
  
  // Static assets: Cache-first
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset)) || 
      url.pathname.match(/\.(css|js|woff2|svg|png|jpg|gif|ico)$/i)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          return response || fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            cache.put(request, response.clone());
            return response;
          }).catch(() => caches.match('/offline.html'));
        });
      })
    );
    return;
  }
  
  // Dynamic content (API, HTML): Network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request) ||
               caches.match('/offline.html');
      })
  );
});

/**
 * Message handling for cache control from app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(AUDIO_CACHE_NAME).then(() => {
      event.ports[0].postMessage({ cleared: true });
    });
  } else if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSizeBytes(AUDIO_CACHE_NAME).then((size) => {
      event.ports[0].postMessage({ 
        sizeMB: (size / 1024 / 1024).toFixed(2),
        limitMB: AUDIO_CACHE_LIMIT_MB 
      });
    });
  }
});
