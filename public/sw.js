const CACHE_NAME = 'misgastos-v1.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/miwalletlogo.png',
  '/src/main.js',
  '/src/App.vue',
  '/src/style.css',
  '/src/router/index.js',
  '/src/stores/auth.js',
  '/src/stores/expenses.js',
  '/src/stores/cards.js',
  '/src/stores/categories.js',
  '/src/components/AppNavigation.vue',
  '/src/components/ExpenseModal.vue',
  '/src/components/CardModal.vue',
  '/src/components/CategoryModal.vue',
  '/src/views/DashboardView.vue',
  '/src/views/ExpensesView.vue',
  '/src/views/CardsView.vue',
  '/src/views/CategoriesView.vue',
  '/src/views/LoginView.vue',
  '/src/views/RegisterView.vue',
  '/src/lib/supabase.js',
  '/src/utils/formatters.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {

        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Error al cachear archivos:', error);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
  
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No cachear API ni Supabase
  if (url.pathname.startsWith('/api/') || url.host.includes('supabase.co')) return;

  if (event.request.method !== 'GET')) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    try {
      const res = await fetch(event.request);
      const ct = res.headers.get('content-type') || '';
      const isOk = res.ok && !ct.includes('text/html');
      if (isOk) await cache.put(event.request, res.clone());
      return res;
    } catch (_) {
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return cache.match('/index.html');
      }
      throw _;
    }
  })());
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'MisGastos',
    body: 'Nueva notificación',
    icon: '/miwalletlogo.png',
    badge: '/miwalletlogo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/miwalletlogo.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar',
        icon: '/miwalletlogo.png'
      }
    ]
  };

  // Si hay datos en el evento push, usarlos
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      // Si no es JSON, usar como texto
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    // Abrir la aplicación en la página específica si hay datos
    const url = event.notification.data?.url || '/dashboard';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'dismiss') {
    // Solo cerrar la notificación
  } else {
    // Clic en la notificación principal
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
}); 