// 또옥또옥 웹앱: 오프라인 실행 등록 + 홈 화면 설치 안내
(function () {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
  }
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone || window.ReactNativeWebView) return;
  var ua = navigator.userAgent, isIOS = /iPhone|iPad|iPod/.test(ua), isAndroid = /Android/.test(ua);
  if (!isIOS && !isAndroid) return;
  var join = (new URLSearchParams(location.search).get('join') || '').replace(/\D/g, '').slice(0, 6);
  // 아이폰: 초대 링크로 연 화면을 홈 화면에 추가하면, 앱이 초대 코드를 가진 채로 열리도록 해요
  if (isIOS && join) { var ml = document.querySelector('link[rel=manifest]'); if (ml) ml.remove(); }
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; var b = document.getElementById('pwaInstallBtn'); if (b) b.style.display = 'block'; });
  function show() {
    if (sessionStorage.getItem('pwa-guide-closed')) return;
    var d = document.createElement('div');
    d.id = 'pwaGuide';
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:90;background:#14284b;color:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 8px 24px rgba(0,0,0,.25);font-size:13.5px;line-height:1.6;font-family:inherit';
    var how = isIOS
      ? '사파리 아래쪽 <b>공유 버튼(네모에 위쪽 화살표)</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 설치돼요.'
      : '크롬 오른쪽 위 <b>⋮ 메뉴</b> → <b>앱 설치</b>(또는 홈 화면에 추가)를 누르면 앱처럼 설치돼요.';
    d.innerHTML = '<div style="font-weight:800;font-size:15px;margin-bottom:4px">또옥또옥을 휴대폰에 설치해 주세요</div>' + how +
      (join ? '<div style="background:rgba(255,255,255,.12);border-radius:10px;padding:8px 10px;margin-top:8px">초대 코드 <b style="font-size:16px;letter-spacing:2px;color:#ffd34d">' + join.slice(0, 3) + ' ' + join.slice(3) + '</b><br><span style="font-size:12px;color:#dbe6f4">설치한 앱에서 이 코드가 자동으로 들어가지 않으면 직접 넣어 주세요</span></div>' : '') +
      '<div style="color:#b9cbe3;font-size:12px;margin-top:4px">설치한 앱에서 노크방을 만들거나 초대 코드를 넣어야 기록이 이어져요.</div>' +
      '<button id="pwaInstallBtn" style="display:none;margin-top:10px;width:100%;border:0;border-radius:12px;padding:11px;background:#ffd34d;color:#14284b;font-weight:800;font-size:14px">지금 설치하기</button>' +
      '<button id="pwaClose" style="position:absolute;right:10px;top:8px;border:0;background:none;color:#b9cbe3;font-size:20px">×</button>';
    document.body.appendChild(d);
    if (deferred) document.getElementById('pwaInstallBtn').style.display = 'block';
    document.getElementById('pwaInstallBtn').onclick = function () { if (deferred) { deferred.prompt(); deferred = null; } };
    document.getElementById('pwaClose').onclick = function () { sessionStorage.setItem('pwa-guide-closed', '1'); d.remove(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
})();
