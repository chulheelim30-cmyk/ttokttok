// 카카오톡 등 앱 안 브라우저로 링크를 열면: 바로 크롬(아이폰은 사파리)으로 옮겨서 설치할 수 있게 해요.
// 앱 안 브라우저는 저장 공간이 따로라, 홈 화면 설치가 안 되고 이름 설정도 따로 저장돼요. (톡톡 kakao.js와 같은 방식)
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
    if (document.getElementById('agOut')) return;
    var d = document.createElement('div');
    d.id = 'agOut';
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#FBF7F2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;font-family:inherit;color:#2D2A26';
    var how = isIOS ? '오른쪽 아래 <b>공유(⋯)</b> → <b>Safari로 열기</b>' : '오른쪽 아래(위) <b>⋮</b> → <b>다른 브라우저로 열기</b>';
    d.innerHTML = '<img src="./icon-192.png" width="84" height="84" style="border-radius:22px;margin-bottom:14px" alt="">' +
      '<div style="font-size:20px;font-weight:800;margin-bottom:8px">' + (isIOS ? 'Safari' : '크롬') + '에서 열어 설치해 주세요</div>' +
      '<div style="font-size:14.5px;line-height:1.7;color:#7A726A">' + (inKakao ? '카카오톡' : '이 앱') + ' 안에서는 앱을 설치할 수 없어요.<br>' + (inKakao || isAndroid ? '아래 버튼이 안 되면 ' : '') + how + '를 눌러 주세요.</div>' +
      '<button id="agOutGo" style="margin-top:20px;width:100%;max-width:320px;border:0;border-radius:14px;padding:15px;background:#2D2A26;color:#fff;font-weight:800;font-size:16px">' + (isIOS ? 'Safari' : '크롬') + '로 열기</button>' +
      '<button id="agOutCopy" style="margin-top:10px;width:100%;max-width:320px;border:1px solid #ECE5DC;border-radius:14px;padding:13px;background:#fff;color:#2D2A26;font-weight:700;font-size:15px">링크 복사하기</button>' +
      '<div id="agOutMsg" style="margin-top:10px;font-size:13px;color:#7A726A;min-height:18px"></div>';
    document.body.appendChild(d);
    var g = document.getElementById('agOutGo'); if (!inKakao && !isAndroid) g.style.display = 'none'; else g.onclick = openOut;
    document.getElementById('agOutCopy').onclick = function () {
      var m = document.getElementById('agOutMsg');
      function ok() { m.textContent = '복사했어요 · 크롬 주소창에 붙여 넣어 주세요'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { prompt('이 링크를 복사해 주세요', url); });
      else prompt('이 링크를 복사해 주세요', url);
    };
  }
  if (document.body) cover(); else document.addEventListener('DOMContentLoaded', cover);
})();
