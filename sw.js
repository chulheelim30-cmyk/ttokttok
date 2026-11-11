// 톡톡 오프라인 실행 (버전 202611041840)
const CACHE = 'ttokttok-202611111709b';
const SHELL = ["./","./index.html","./app-c75c4667.js?v=9","./app-21865120.css","./theme.css?v=8","./pwa.js?v=2","./kakao.js?v=1","./back.js?v=2","./push.js?v=4","./mood.js?v=9","./ptr.js?v=1","./rooms.js?v=32","./account.js?v=1","./anim.js?v=10","./easy.js?v=1","./puzzle.js?v=5","./manifest.webmanifest?v=9","./icon-192.png?v=9","./icon-512.png?v=9","./icon-180.png?v=9","./favicon.svg?v=10","./art/g01.webp?v=2","./art/g02.webp?v=2","./art/g03.webp?v=2","./art/g04.webp?v=2","./art/g05.webp?v=2","./art/g06.webp?v=2","./art/g07.webp?v=2","./art/g08.webp?v=2","./art/g09.webp?v=2","./art/g10.webp?v=2","./art/g11.webp?v=2","./art/g12.webp?v=2","./privacy.html"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // 서버(수파베이스) 요청은 항상 인터넷으로
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// 휴대폰 알림
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '톡톡', {
    body: d.body || '', tag: d.tag || 'ttok', renotify: true,
    icon: './icon-192.png', vibrate: [60, 80, 60], data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
