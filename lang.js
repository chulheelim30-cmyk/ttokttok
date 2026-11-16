// 휴대폰 언어가 한국어가 아니면 'en'으로 서버(user_lang)에 저장해요 → 휴대폰 알림이 영어로 가요(push 엣지 함수). 11/16
(function () {
  var want = /^ko/i.test((navigator.languages && navigator.languages[0]) || navigator.language || 'ko') ? 'ko' : 'en';
  var KEY = 'tt-lang-sent';
  var sent = ''; try { sent = localStorage.getItem(KEY) || ''; } catch (e) {}
  if (sent === want || (want === 'ko' && !sent)) return;
  var n = 0;
  (function go() {
    if (typeof window.__ttRpc !== 'function' || (typeof window.__ttMe === 'function' && !window.__ttMe())) { if (++n < 40) setTimeout(go, 1500); return; }
    Promise.resolve(window.__ttRpc('set_lang', { p_lang: want })).then(function () { try { localStorage.setItem(KEY, want); } catch (e) {} }).catch(function () {});
  })();
})();
