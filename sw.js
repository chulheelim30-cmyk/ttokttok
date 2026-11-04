// 또옥또옥 오프라인 실행 (버전 202611041840)
const CACHE = 'ttokttok-202611042225';
const SHELL = ["./","./index.html","./app-bcf9b0bb.js","./app-21865120.css","./pwa.js","./back.js?v=2","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-180.png","./favicon.svg","./art/m01.webp?v=2","./art/m02.webp?v=2","./art/m03.webp?v=2","./art/m04.webp?v=2","./art/m05.webp?v=2","./art/m06.webp?v=2","./art/m07.webp?v=2","./art/m08.webp?v=2","./art/m09.webp?v=2","./art/m10.webp?v=2","./art/m11.webp?v=2","./art/m11-orig.webp?v=2","./privacy.html","./art/m12.webp?v=2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // 서버(수파베이스) 요청은 항상 인터넷으로
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
