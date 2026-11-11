// 톡톡 아래로 당겨서 새로고침 (노크·노크방·그림첩 화면만, 설정은 빼요)
// - 새로고침한 뒤에도 보던 화면(탭)으로 돌아가요.
// - 맨 위에서 아래로 당기면 동그라미가 내려오고, 충분히 당겼다 놓으면 새로고침해요.
// - 안쪽 목록·창이 스크롤된 상태면 그 목록 먼저 올라가게 두고, 맨 위일 때만 동작해요.
(function () {
  var MAX = 110, GO = 75, y0 = null, dy = 0, el, ic, busy = false;
  try { document.documentElement.style.overscrollBehaviorY = 'contain'; document.body && (document.body.style.overscrollBehaviorY = 'contain'); } catch (e) {}
  function ui() {
    if (el) return;
    el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:50%;top:0;z-index:10000;width:40px;height:40px;margin-left:-20px;border-radius:50%;background:#fffaf3;box-shadow:0 2px 10px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;transform:translateY(-50px);opacity:0;pointer-events:none';
    el.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="#7a9a7e" stroke-width="2.6" stroke-linecap="round"/><path d="M20 4v5h-5" fill="none" stroke="#7a9a7e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    ic = el.firstChild; document.body.appendChild(el);
    var s = document.createElement('style'); s.textContent = '@keyframes ttSpin{to{transform:rotate(360deg)}}'; document.head.appendChild(s);
  }
  var OK = { knock: 1, room: 1, album: 1 };
  function tab() { var b = document.querySelector('.nav button.on'); return b ? b.getAttribute('data-v') : ''; }
  // 새로고침 뒤 보던 탭으로 돌아가기
  try {
    var back = sessionStorage.getItem('tt-ptr-tab'); sessionStorage.removeItem('tt-ptr-tab');
    if (back && OK[back]) window.addEventListener('load', function () {
      // 화면은 index.html에서 미리 바꿔 둬요(첫 화면 깜빡임 없음), 여기선 내용만 다시 그려요
      var n = 0, t = setInterval(function () { if (typeof window.go === 'function' && document.getElementById('v-' + back)) { clearInterval(t); try { window.go(back); } catch (e) {} } else if (++n > 40) clearInterval(t); }, 30);
    });
  } catch (e) {}
  function atTop(t) {
    if (!OK[tab()]) return false;
    if ((window.scrollY || document.documentElement.scrollTop) > 0) return false;
    for (var n = t; n && n !== document.body && n.nodeType === 1; n = n.parentNode) {
      if (n.scrollTop > 0) return false;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName)) return false;
    }
    return true;
  }
  function show(d) {
    ui(); var p = Math.min(d / GO, 1);
    el.style.transition = 'none';
    el.style.opacity = String(Math.min(1, d / 30));
    el.style.transform = 'translateY(' + (Math.min(d, MAX) * 0.8 - 40) + 'px)';
    ic.style.transform = 'rotate(' + (p * 270) + 'deg)';
    ic.style.opacity = p >= 1 ? '1' : '.55';
  }
  function hide() { if (!el) return; el.style.transition = 'transform .25s, opacity .25s'; el.style.transform = 'translateY(-50px)'; el.style.opacity = '0'; }
  document.addEventListener('touchstart', function (e) {
    if (busy || e.touches.length !== 1 || !atTop(e.target)) { y0 = null; return; }
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (y0 === null) return;
    dy = (e.touches[0].clientY - y0) * 0.6;
    if (dy > 4) show(dy); else if (el) hide();
  }, { passive: true });
  document.addEventListener('touchend', function () {
    if (y0 === null) return; y0 = null;
    if (dy >= GO) {
      busy = true; ui();
      el.style.transition = 'transform .2s'; el.style.transform = 'translateY(24px)';
      ic.style.animation = 'ttSpin .7s linear infinite';
      try { sessionStorage.setItem('tt-ptr-tab', tab()); } catch (e) {}
      setTimeout(function () { location.reload(); }, 250);
    } else hide();
    dy = 0;
  }, { passive: true });
})();
