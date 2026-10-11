// Service Worker — الصف العاشر
const CACHE_VERSION = 'saff-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/maskable-512x512.png'
];

// تركيب
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

// تفعيل
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// استراتيجية: Network first, fallback to cache
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, clone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

// استقبال إشعار من الصفحة
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'notify'){
    self.registration.showNotification(e.data.title || 'الصف العاشر', {
      body: e.data.body || 'رسالة جديدة',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      tag: e.data.tag || 'chat',
      renotify: true,
      data: { url: e.data.url || './index.html#livechat' }
    });
  }
});

// فتح التطبيق لما يكبس على الإشعار
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './index.html#livechat';
  e.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
      for(const c of list){ if('focus' in c) return c.focus(); }
      if(self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Push notifications (لو استعملنا FCM بعدين)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'الصف العاشر', {
      body: data.body || 'رسالة جديدة',
      icon: './icons/icon-192x192.png',
      dir: 'rtl',
      vibrate: [200, 100, 200]
    })
  );
});
