// 카카오톡 등 앱 안 브라우저로 링크를 열면: 바로 크롬(아이폰은 사파리)으로 옮겨서 설치할 수 있게 해요.
// 앱 안 브라우저는 저장 공간이 따로라, 그대로 쓰면 같은 사람이 새 계정으로 방에 한 번 더 들어가요.
(function () {
  var ua = navigator.userAgent || '';
  var inKakao = /KAKAOTALK/i.test(ua);
  var inApp = inKakao || /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|BAND\//i.test(ua);
  if (!inApp) return;
  var isAndroid = /Android/i.test(ua), isIOS = /iPhone|iPad|iPod/i.test(ua);
  var url = location.href;
  function openOut() {
    if (inKakao) { location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url); return; }
    if (isAndroid) {
      location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
    }
  }
  // 1) 바로 바깥 브라우저로 열기 시도
  openOut();
  // 2) 안 넘어가면(또는 돌아왔을 때) 안내 화면을 보여요
  function cover() {
    if (document.getElementById('ttOut')) return;
    var d = document.createElement('div');
    d.id = 'ttOut';
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#f4f1ea;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;font-family:inherit;color:#14284b';
    var how = isIOS ? '오른쪽 아래 <b>공유(⋯)</b> → <b>Safari로 열기</b>' : '오른쪽 아래(위) <b>⋮</b> → <b>다른 브라우저로 열기</b>';
    d.innerHTML = '<img src="./icon-192.png?v=6" width="84" height="84" style="border-radius:22px;margin-bottom:14px" alt="">' +
      '<div style="font-size:20px;font-weight:800;margin-bottom:8px">' + (isIOS ? 'Safari' : '크롬') + '에서 열어 설치해 주세요</div>' +
      '<div style="font-size:14.5px;line-height:1.7;color:#4a5a75">' + (inKakao ? '카카오톡' : '이 앱') + ' 안에서는 앱을 설치할 수 없어요.<br>' + (inKakao || isAndroid ? '아래 버튼이 안 되면 ' : '') + how + '를 눌러 주세요.</div>' +
      '<button id="ttOutGo" style="margin-top:20px;width:100%;max-width:320px;border:0;border-radius:14px;padding:15px;background:#14284b;color:#fff;font-weight:800;font-size:16px">' + (isIOS ? 'Safari' : '크롬') + '로 열기</button>' +
      '<button id="ttOutCopy" style="margin-top:10px;width:100%;max-width:320px;border:1px solid #c9d2e0;border-radius:14px;padding:13px;background:#fff;color:#14284b;font-weight:700;font-size:15px">링크 복사하기</button>' +
      '<div id="ttOutMsg" style="margin-top:10px;font-size:13px;color:#4a5a75;min-height:18px"></div>';
    document.body.appendChild(d);
    var g = document.getElementById('ttOutGo'); if (!inKakao && !isAndroid) g.style.display = 'none'; else g.onclick = openOut;
    document.getElementById('ttOutCopy').onclick = function () {
      var m = document.getElementById('ttOutMsg');
      function ok() { m.textContent = '복사했어요 · 크롬 주소창에 붙여 넣어 주세요'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { prompt('이 링크를 복사해 주세요', url); });
      else prompt('이 링크를 복사해 주세요', url);
    };
  }
  if (document.body) cover(); else document.addEventListener('DOMContentLoaded', cover);
})();
