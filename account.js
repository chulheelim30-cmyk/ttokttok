// 톡톡 '내 기록 모두 지우기(탈퇴)'
// 설정 맨 아래 버튼 → 안내 창 → 한 번 더 눌러야 지워져요.
(function () {
  var FN = 'https://pbmocpzclvndlevuvfto.supabase.co/functions/v1/account';
  function toast(t) { var e = document.getElementById('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { e.classList.remove('on'); }, 3000); }

  function sheet() {
    var s = document.getElementById('deleteSheet');
    if (s) return s;
    s = document.createElement('div');
    s.className = 'sheet'; s.id = 'deleteSheet';
    s.innerHTML = '<div class="dim" data-close></div><div class="pan"><div class="grab"></div>' +
      '<div class="top"><div class="logo" style="font-size:18px">내 기록 모두 지우기</div></div>' +
      '<div style="padding:0 18px">' +
      '<div class="t2" style="line-height:1.75">지우면 되돌릴 수 없어요.<br>' +
      '· 내 이름, 전화번호, 알림 주소, 컨디션, 계정이 모두 지워져요<br>' +
      '· 내가 방장인 노크방은 다음 사람이 방장이 돼요. 혼자 있는 방은 없어져요<br>' +
      '· 함께 채운 그림은 그대로 남아요. 내 노크는 누구인지 알 수 없게 바뀌어요</div>' +
      '<button class="btn" style="margin-top:16px;color:#fff;background:#c0392b" id="delGo">지울게요</button>' +
      '<button class="btn bw" style="margin-top:8px" data-close>그만두기</button>' +
      '<div class="t3" style="text-align:center;margin-top:8px">다시 쓰고 싶으면 언제든 새로 시작할 수 있어요</div>' +
      '</div></div>';
    document.body.appendChild(s);
    Array.prototype.forEach.call(s.querySelectorAll('[data-close]'), function (b) { b.onclick = close; });
    document.getElementById('delGo').onclick = go;
    return s;
  }
  var armed = false;
  function open() { armed = false; var s = sheet(); var b = document.getElementById('delGo'); b.textContent = '지울게요'; b.disabled = false; s.classList.add('on'); }
  function close() { var s = document.getElementById('deleteSheet'); if (s) s.classList.remove('on'); }
  async function go() {
    var b = document.getElementById('delGo');
    if (!armed) { armed = true; b.textContent = '정말 지울게요 (한 번 더 누르기)'; return; }
    b.disabled = true; b.textContent = '지우는 중…';
    try {
      var token = window.__ttAuth ? await window.__ttAuth() : null;
      if (!token) throw new Error('로그인 정보를 찾지 못했어요');
      var r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ action: 'delete_me', confirm: '지워 주세요' }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || !j.ok) throw new Error(j.error || ('서버 오류 ' + r.status));
      try {
        var reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration('./');
        var sub = reg && await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      } catch (e) {}
      try {
        Object.keys(localStorage).forEach(function (k) { if (/^(ttokttok|tt-)/.test(k)) localStorage.removeItem(k); });
        sessionStorage.clear();
      } catch (e) {}
      toast('모두 지웠어요. 그동안 고마웠어요');
      setTimeout(function () { location.replace(location.pathname); }, 1600);
    } catch (e) {
      armed = false; b.disabled = false; b.textContent = '지울게요';
      toast('지우지 못했어요 · ' + ((e && e.message) || '잠시 뒤 다시 시도해 주세요'));
    }
  }
  window.ttDeleteMe = open;
})();
