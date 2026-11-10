// 톡톡 휴대폰 알림 (웹 푸시)
// 켜 두면: 가까운 사람의 노크가 기준 시간 넘게 멈출 때, 콕 찔렸을 때, 저녁 8시까지 노크를 안 했을 때 알려 줘요.
(function () {
  var FN = 'https://pbmocpzclvndlevuvfto.supabase.co/functions/v1/push';
  var KEY = 'BCLr8UHvPnRqzpzBlpMTYfCNm90YiM4j_jGwwTNWF2cvCyaWx4GxQIdbFO6rSF-kNDQCZcw11Qy9XAkkMP4EU_8';
  var ua = navigator.userAgent, isIOS = /iPhone|iPad|iPod/.test(ua);
  var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var LS = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  function why() {
    if (window.ReactNativeWebView) return '토스 앱 안에서는 정식 출시 때 알림이 열려요';
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return isIOS && !standalone ? '아이폰은 사파리에서 홈 화면에 추가한 앱으로 열면 켤 수 있어요' : '이 브라우저는 휴대폰 알림을 지원하지 않아요';
    }
    if (location.protocol !== 'https:') return '보안 연결(https)에서만 켤 수 있어요';
    return '';
  }
  function b64(s) {
    var p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'));
    var a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a;
  }
  function toast(t) { var e = document.getElementById('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  async function token() { return window.__ttAuth ? await window.__ttAuth() : null; }
  async function rpc(name, body) {
    if (!window.__ttRpc) throw new Error('잠시 뒤 다시 눌러 주세요');
    return window.__ttRpc(name, body);
  }
  async function currentSub() {
    if (why()) return null;
    var reg = await navigator.serviceWorker.getRegistration('./');
    return reg ? reg.pushManager.getSubscription() : null;
  }
  async function save(sub) {
    var j = sub.toJSON();
    await rpc('save_push_sub', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_ua: ua.slice(0, 200) });
    LS('tt-push-saved', String(Date.now()));
    LS('tt-push-user', String((window.__ttMe && window.__ttMe()) || ''));
  }

  async function enable() {
    var w = why(); if (w) { toast(w); return false; }
    var p = await Notification.requestPermission();
    if (p !== 'granted') { render(); toast('알림이 허용되지 않았어요 · 휴대폰 설정에서 바꿀 수 있어요'); return false; }
    try {
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) });
      await save(sub);
      render(); toast('휴대폰 알림을 켰어요 · 노크가 멈추면 알려 드려요');
      return true;
    } catch (e) { render(); toast('알림을 켜지 못했어요 · ' + (e && e.message || '다시 시도해 주세요')); return false; }
  }
  async function disable() {
    try {
      var sub = await currentSub();
      if (sub) { await rpc('remove_push_sub', { p_endpoint: sub.endpoint }).catch(function () {}); await sub.unsubscribe(); }
    } catch (e) {}
    render(); toast('휴대폰 알림을 껐어요');
  }
  async function test() {
    try {
      var t = await token();
      var r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ action: 'test' }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || ('서버 오류 ' + r.status));
      if (j.sent > 0) toast('테스트 알림을 보냈어요 · 몇 초 안에 와요');
      else { toast('이 휴대폰 알림 등록이 끊겼어요 · 다시 켜 주세요'); var s = await currentSub(); if (s) await s.unsubscribe(); render(); }
    } catch (e) { toast('테스트 알림을 못 보냈어요 · ' + (e && e.message || '')); }
  }

  async function render() {
    var txt = document.getElementById('pushTxt'), btn = document.getElementById('pushBtn'), tb = document.getElementById('pushTest');
    if (!txt || !btn) return;
    var w = why();
    if (w) { txt.textContent = w; btn.style.display = 'none'; tb.style.display = 'none'; return; }
    btn.style.display = '';
    var on = Notification.permission === 'granted' && !!(await currentSub());
    if (Notification.permission === 'denied') {
      txt.textContent = '알림이 막혀 있어요 · 휴대폰 설정 → 애플리케이션 → 크롬(또는 톡톡) → 알림에서 허용해 주세요';
      btn.style.display = 'none'; tb.style.display = 'none'; return;
    }
    txt.textContent = on ? '켜짐 · 노크가 멈추거나 콕 찔리면 이 휴대폰으로 알려요' : '꺼짐 · 켜면 가까운 사람 노크가 멈출 때 바로 알 수 있어요';
    btn.textContent = on ? '끄기' : '켜기';
    btn.className = on ? 'mini bs' : 'mini';
    if (!on) { btn.style.background = '#14284b'; btn.style.color = '#fff'; } else { btn.style.background = ''; btn.style.color = ''; }
    tb.style.display = on ? 'block' : 'none';
    btn.onclick = function () { on ? disable() : enable(); };
  }

  // 앱을 열 때마다 알림이 꺼져 있으면 크게 안내해요 ('나중에'는 6시간 쉬기)
  function maybeAsk() {
    if (why() || document.getElementById('pushAsk')) return;
    var p = Notification.permission;
    if (p === 'granted') return;
    if (Date.now() - +(LS('tt-push-ask-at') || 0) < (p === 'denied' ? 24 : 6) * 3600e3) return;
    if (!(window.__ttMe && window.__ttMe())) return;
    if (document.querySelector('.sheet.on')) { clearTimeout(maybeAsk.h); maybeAsk.h = setTimeout(maybeAsk, 3000); return; }
    var d = document.createElement('div');
    d.id = 'pushAsk';
    d.style.cssText = 'position:fixed;inset:0;z-index:95;background:rgba(20,30,50,.55);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit';
    var body = p === 'denied'
      ? '<div style="font-size:14px;line-height:1.6;color:#3a465a;text-align:left;background:#f4f6fa;border-radius:12px;padding:12px 14px;margin-top:12px">' +
        '휴대폰에서 알림이 막혀 있어요. 이렇게 풀어 주세요.<br><b>1.</b> 휴대폰 <b>설정</b> → <b>애플리케이션</b><br><b>2.</b> <b>크롬</b>(또는 <b>톡톡</b>) → <b>알림</b><br><b>3.</b> <b>알림 허용</b> 켜기</div>'
      : '';
    d.innerHTML = '<div style="background:#fff;color:#23324a;border-radius:22px;padding:24px 20px 18px;max-width:360px;width:100%;text-align:center;box-shadow:0 12px 32px rgba(0,0,0,.25)">' +
      '<div style="font-size:46px;line-height:1">🔔</div>' +
      '<div style="font-weight:900;font-size:20px;margin:10px 0 6px">알림을 꼭 켜 주세요</div>' +
      '<div style="font-size:14.5px;line-height:1.6;color:#4a5568">알림이 꺼져 있으면 <b style="color:#c0392b">가까운 사람 소식이 끊겨도 알 수 없어요.</b><br>새 소식·콕 찌르기·업데이트도 알림으로 와요.</div>' + body +
      '<button id="pushAskYes" style="display:block;width:100%;margin-top:16px;border:0;background:#14284b;color:#fff;border-radius:14px;padding:15px;font:inherit;font-size:16.5px;font-weight:900">' + (p === 'denied' ? '설정했어요 · 다시 확인' : '알림 켜기') + '</button>' +
      '<button id="pushAskNo" style="display:block;width:100%;margin-top:6px;border:0;background:none;padding:10px;font:inherit;font-size:13.5px;color:#8a94a6">나중에</button></div>';
    document.body.appendChild(d);
    document.getElementById('pushAskNo').onclick = function () { LS('tt-push-ask-at', String(Date.now())); d.remove(); };
    document.getElementById('pushAskYes').onclick = async function () {
      d.remove();
      if (Notification.permission === 'denied') { toast('아직 막혀 있어요 · 설정에서 알림을 허용한 뒤 앱을 다시 열어 주세요'); LS('tt-push-ask-at', String(Date.now() - 23 * 3600e3)); return; }
      var ok = await enable(); if (!ok) LS('tt-push-ask-at', String(Date.now()));
    };
  }

  window.ttPushEnable = enable;
  window.ttPushTest = test;
  window.ttPushRender = render;

  window.addEventListener('load', function () {
    render();
    // 알림이 켜져 있으면 하루에 한 번 서버 등록을 새로 고쳐요 (계정이 바뀌어도 이어지게)
    setTimeout(async function () {
      try {
        if (why()) return;
        if (Notification.permission !== 'granted') { maybeAsk(); return; }

        // 허락은 돼 있는데 등록이 없거나(앱 재설치·만료), 계정이 바뀌었으면 조용히 다시 등록해요
        var me = window.__ttMe && window.__ttMe(), s = await currentSub();
        if (!s) { var reg = await navigator.serviceWorker.ready; s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) }); }
        if (!s) return;
        if (Date.now() - +(LS('tt-push-saved') || 0) > 6 * 3600e3 || LS('tt-push-user') !== String(me || '')) { await save(s); LS('tt-push-user', String(me || '')); }
        render();
      } catch (e) {}
    }, 4000);
    var pung = document.getElementById('pung');
    if (pung && 'MutationObserver' in window) {
      var was = pung.classList.contains('done');
      new MutationObserver(function () {
        var now = pung.classList.contains('done');
        if (now && !was) setTimeout(maybeAsk, 2200);
        was = now;
      }).observe(pung, { attributes: true, attributeFilter: ['class'] });
    }
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { render(); setTimeout(maybeAsk, 2500); } });
})();
