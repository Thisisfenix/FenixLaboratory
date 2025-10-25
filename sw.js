const CACHE_NAME = 'fenix-lab-v2.0.5';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './placeholder/GHbDEIgXMAACVEi.jpg',
  './placeholder/GzyBNcWWsAEcgbH.jpg',
  './credits.json',
  './updates.json'
];

const EXTERNAL_CACHE = 'fenix-external-v1';
const externalUrls = [
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'
];

self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Cacheando archivos locales');
        return cache.addAll(urlsToCache);
      }),
      caches.open(EXTERNAL_CACHE).then(cache => {
        console.log('🌐 Cacheando recursos externos');
        return cache.addAll(externalUrls).catch(err => {
          console.log('⚠️ Error cacheando externos:', err);
        });
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('📦 Sirviendo desde cache:', event.request.url);
          return response;
        }
        
        // Network first para API calls
        if (event.request.url.includes('api.github.com')) {
          return fetch(event.request).catch(() => {
            return new Response(JSON.stringify({ error: 'Offline' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        }
        
        // Cache first para otros recursos
        return fetch(event.request).then(fetchResponse => {
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }
          
          const responseToCache = fetchResponse.clone();
          const cacheName = event.request.url.startsWith('http') && !event.request.url.includes(location.origin) 
            ? EXTERNAL_CACHE : CACHE_NAME;
            
          caches.open(cacheName).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return fetchResponse;
        }).catch(() => {
          // Fallback offline
          if (event.request.destination === 'document') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== EXTERNAL_CACHE) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Mensaje desde la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificaciones push (para futuro)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './favicon.svg',
      badge: './favicon.svg'
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./')
  );
});