// 아이곁은 https://chulheelim30-cmyk.github.io/aigyeot/ 로 옮김. 예전 서비스워커는 스스로 해제.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('aigyeot')).map(k => caches.delete(k)))).then(() => self.registration.unregister())); });
