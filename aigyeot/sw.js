// 아이곁 서비스워커: 화면 파일만 보관(인터넷 끊겨도 열리게). 기록 저장소(supabase) 요청은 건드리지 않음.
const CACHE = 'aigyeot-v1';
const SHELL = ['./', './index.html', './kakao.js', './manifest.webmanifest', './icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(e.request.mode === 'navigate' ? './index.html' : e.request, copy)); return r; })
    .catch(() => caches.match(e.request.mode === 'navigate' ? './index.html' : e.request, { ignoreSearch: true })));
});
