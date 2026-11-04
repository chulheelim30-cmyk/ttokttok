// 또옥또옥 오프라인 실행 (버전 202611040842)
const CACHE = 'ttokttok-202611040842';
const SHELL = ["./","./index.html","./app-D2AApFXi.js","./app-21865120.css","./pwa.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-180.png","./favicon.svg","./art/m01.webp","./art/m02.webp","./art/m03.webp","./art/m04.webp","./art/m05.webp","./art/m06.webp","./art/m07.webp","./art/m08.webp","./art/m09.webp","./art/m10.webp","./art/m11.webp","./art/m12.webp"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // 서버(수파베이스) 요청은 항상 인터넷으로
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
