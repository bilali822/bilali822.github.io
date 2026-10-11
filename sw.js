// Service Worker — الصف العاشر (مع FCM)
const CACHE_VERSION = 'saff-v3';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(ASSETS).catch(function(){})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_VERSION; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(res){
      const clone = res.clone();
      caches.open(CACHE_VERSION).then(function(c){ c.put(e.request, clone); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); });
    })
  );
});

/* Firebase Cloud Messaging */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCSTvrlV-0RM9LnxWNBhvR-E_jIWE1x6Wk",
  authDomain: "saff-10.firebaseapp.com",
  projectId: "saff-10",
  storageBucket: "saff-10.firebasestorage.app",
  messagingSenderId: "581594259710",
  appId: "1:581594259710:web:32193312221b518b5c85af"
});

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function(payload){
    console.log('[SW] Background:', payload);
    const n = payload.notification || {};
    const d = payload.data || {};
    self.registration.showNotification(n.title || '💬 رسالة جديدة', {
      body: n.body || 'حدا كتب بالشات',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      tag: 'chat-msg',
      renotify: true,
      data: { url: d.url || './index.html#livechat' }
    });
  });
} catch(e) {
  console.warn('FCM SW error:', e);
}

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './index.html#livechat';
  e.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(list){
      for(let i = 0; i < list.length; i++){
        if('focus' in list[i]) return list[i].focus();
      }
      if(self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
