// ===================================
// 🚀 ZENDEA SERVICE WORKER
// ===================================

const CACHE_NAME = 'zendea-v1.0.0';
const STATIC_CACHE = 'zendea-static-v1';
const DYNAMIC_CACHE = 'zendea-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/login.html',
  '/post.html',
  '/profile.html',
  '/style.css',
  '/app.js',
  '/auth.js',
  '/post.js',
  '/profile.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Error caching static files:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (STATIC_FILES.includes(url.pathname) || url.pathname === '/') {
    // Serve static files from cache first
    event.respondWith(cacheFirst(request));
  } else if (url.origin === location.origin) {
    // For same-origin requests, try network first then cache
    event.respondWith(networkFirst(request));
  } else {
    // For external resources, use cache first with network fallback
    event.respondWith(cacheFirst(request));
  }
});

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache first failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Network first failed:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'post-submission') {
    event.waitUntil(syncPostSubmissions());
  } else if (event.tag === 'user-actions') {
    event.waitUntil(syncUserActions());
  }
});

// Sync offline post submissions
async function syncPostSubmissions() {
  try {
    const pendingPosts = await getStoredData('pending-posts');
    
    for (const post of pendingPosts) {
      try {
        // Simulate API call (replace with actual Firebase call)
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        });
        
        if (response.ok) {
          // Remove from pending list
          await removeStoredData('pending-posts', post.id);
          console.log('✅ Post synced successfully:', post.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync post:', error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Sync offline user actions
async function syncUserActions() {
  try {
    const pendingActions = await getStoredData('pending-actions');
    
    for (const action of pendingActions) {
      try {
        // Sync bookmarks, likes, etc.
        const response = await fetch(`/api/actions/${action.type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
        
        if (response.ok) {
          await removeStoredData('pending-actions', action.id);
          console.log('✅ Action synced successfully:', action.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('❌ Action sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', event => {
  console.log('📲 Push notification received');
  
  const options = {
    body: 'You have new job opportunities waiting!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Jobs',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  };
  
  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.title = payload.title || 'Zendea';
  }
  
  event.waitUntil(
    self.registration.showNotification('Zendea', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB storage
async function getStoredData(storeName) {
  try {
    return JSON.parse(localStorage.getItem(storeName) || '[]');
  } catch (error) {
    console.error('❌ Error getting stored data:', error);
    return [];
  }
}

async function removeStoredData(storeName, id) {
  try {
    const data = await getStoredData(storeName);
    const filtered = data.filter(item => item.id !== id);
    localStorage.setItem(storeName, JSON.stringify(filtered));
  } catch (error) {
    console.error('❌ Error removing stored data:', error);
  }
}

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Zendea Service Worker loaded successfully');