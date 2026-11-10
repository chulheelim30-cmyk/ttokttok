// 쉬운 모드 (어르신용): 아주 큰 노크 버튼 하나 + 노크방 사람들 무사 여부만 크게
// 켜는 법: 설정 → '쉬운 모드 켜기' 또는 주소 끝에 ?easy=1  · 끄기: 화면 맨 아래 '보통 화면' 두 번 누르기
(function () {
  var LS = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  try { var q = new URLSearchParams(location.search).get('easy'); if (q === '1') LS('tt-easy', '1'); if (q === '0') LS('tt-easy', '0'); } catch (e) {}
  var on = function () { return LS('tt-easy') === '1'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var box, timer, msgT;

  var css = '#easy{position:fixed;inset:0;z-index:90;background:#fbf7ef;color:#1d2a40;overflow-y:auto;font-family:inherit;padding:calc(18px + env(safe-area-inset-top,0px)) 18px calc(24px + env(safe-area-inset-bottom,0px));-webkit-user-select:none;user-select:none}' +
    '#easy .ez-date{font-size:22px;font-weight:800;text-align:center}' +
    '#easy .ez-room{font-size:17px;color:#6b7486;text-align:center;margin-top:2px}' +
    '#easy .ez-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;width:min(78vw,300px);height:min(78vw,300px);margin:22px auto 8px;border-radius:50%;border:0;background:#14284b;color:#fff;font:inherit;font-size:34px;font-weight:900;line-height:1.25;box-shadow:0 10px 0 #0a1730,0 14px 28px rgba(20,40,75,.3);transition:transform .1s}' +
    '#easy .ez-btn:active{transform:translateY(6px);box-shadow:0 4px 0 #0a1730}' +
    '#easy .ez-btn small{font-size:19px;font-weight:700;opacity:.85;margin-top:8px}' +
    '#easy .ez-btn.done{background:#2e8b57;box-shadow:0 10px 0 #1d5e3a,0 14px 28px rgba(46,139,87,.3)}' +
    '#easy .ez-msg{min-height:30px;text-align:center;font-size:20px;font-weight:800;color:#2e8b57;margin:6px 0 10px}' +
    '#easy .ez-h{font-size:21px;font-weight:900;margin:8px 4px 10px}' +
    '#easy .ez-p{display:flex;align-items:center;gap:12px;background:#fff;border-radius:18px;padding:16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)}' +
    '#easy .ez-n{flex:1;font-size:24px;font-weight:900;word-break:keep-all}' +
    '#easy .ez-s{font-size:19px;font-weight:900;padding:8px 12px;border-radius:12px;white-space:nowrap}' +
    '#easy .ok{background:#e3f4e9;color:#1f7a45}#easy .wait{background:#eef0f4;color:#5a6577}#easy .bad{background:#fde8e6;color:#c0392b}' +
    '#easy .ez-off{display:block;margin:26px auto 0;border:0;background:none;font:inherit;font-size:14px;color:#9aa3b2;padding:10px}';

  function sameDay(t) { if (!t) return false; var a = new Date(t), b = new Date(); return a.toDateString() === b.toDateString(); }
  function hoursSince(t) { return t ? (Date.now() - Date.parse(t)) / 36e5 : Infinity; }
  function knockedToday() { var b = document.getElementById('knockBtn'); return !!(b && b.classList.contains('done')); }

  function render() {
    if (!box) return;
    if (document.querySelector('.sheet.on')) document.querySelectorAll('.sheet.on').forEach(function (s) { s.classList.remove('on'); });
    var me = window.__ttMe && window.__ttMe();
    var room = window.__ttRoom;
    var list = (window.__ttMembers ? window.__ttMembers() : []).filter(function (m) { return m.user_id !== me; });
    var d = new Date(), wd = '일월화수목금토'[d.getDay()];
    var done = knockedToday();
    var people = list.map(function (m) {
      var s;
      if (m.paused) s = '<span class="ez-s wait">잠시 쉬는 중</span>';
      else if (sameDay(m.last_knock_at)) s = '<span class="ez-s ok">✓ 잘 있어요</span>';
      else if (hoursSince(m.last_knock_at) >= (m.threshold_hours || 48)) s = '<span class="ez-s bad">소식이 없어요</span>';
      else s = '<span class="ez-s wait">아직이에요</span>';
      return '<div class="ez-p"><div class="ez-n">' + esc(m.name) + '</div>' + s + '</div>';
    }).join('') || '<div class="ez-p"><div class="ez-n" style="font-size:19px;color:#6b7486">아직 함께하는 사람이 없어요</div></div>';
    var html = '<div class="ez-date">' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + wd + '요일</div>' +
      (room && room.name ? '<div class="ez-room">' + esc(room.name) + '</div>' : '') +
      '<button class="ez-btn' + (done ? ' done' : '') + '" id="ezKnock">' + (done ? '✓<br>오늘 안부<br>전했어요' : '여기를<br>누르세요<small>“잘 있어요” 보내기</small>') + '</button>' +
      '<div class="ez-msg" id="ezMsg"></div>' +
      '<div class="ez-h">우리 사람들 오늘 소식</div>' + people +
      '<button class="ez-off" id="ezOff">보통 화면으로</button>';
    var keep = (document.getElementById('ezMsg') || {}).textContent || '';
    if (box.__last === html) return;
    box.__last = html; box.innerHTML = html;
    if (keep) document.getElementById('ezMsg').textContent = keep;
    document.getElementById('ezKnock').onclick = knock;
    var off = document.getElementById('ezOff');
    off.onclick = function () {
      if (off.__armed) { LS('tt-easy', '0'); stop(); return; }
      off.__armed = true; off.textContent = '한 번 더 누르면 보통 화면으로 바뀌어요';
      setTimeout(function () { off.__armed = false; if (off.isConnected) off.textContent = '보통 화면으로'; }, 3000);
    };
  }

  function msg(t) { var m = document.getElementById('ezMsg'); if (!m) return; m.textContent = t; clearTimeout(msgT); msgT = setTimeout(function () { if (m.isConnected) m.textContent = ''; }, 6000); }

  function knock() {
    if (knockedToday()) { msg('오늘은 벌써 안부를 전했어요 😊'); return; }
    var b = document.getElementById('knockBtn'); if (!b) return;
    try { navigator.vibrate && navigator.vibrate([30, 60, 30]); } catch (e) {}
    b.click(); setTimeout(function () { b.click(); }, 120); // 앱의 '두 번 두드리기'를 대신 해 줘요
    msg('잘 전했어요! 가족이 안심해요');
    setTimeout(function () { box && (box.__last = ''); render(); }, 900);
  }

  function start() {
    if (box || !on()) return;
    if (!window.__ttRoom) { clearTimeout(start.h); start.h = setTimeout(start, 1500); return; } // 방에 들어간 뒤에만
    if (!document.getElementById('easyCss')) { var st = document.createElement('style'); st.id = 'easyCss'; st.textContent = css; document.head.appendChild(st); }
    box = document.createElement('div'); box.id = 'easy'; document.body.appendChild(box);
    render(); timer = setInterval(render, 3000);
  }
  function stop() { clearInterval(timer); if (box) box.remove(); box = null; settingRow(); }

  // 설정 화면에 켜기 버튼
  function settingRow() {
    var v = document.getElementById('v-set'); if (!v) return;
    var c = document.getElementById('easySet');
    if (!c) {
      c = document.createElement('div'); c.className = 'card'; c.id = 'easySet';
      var top = v.querySelector('.top'); top && top.nextSibling ? v.insertBefore(c, top.nextSibling) : v.appendChild(c);
    }
    c.innerHTML = '<div class="row"><div style="text-align:left"><div class="t1" style="font-size:15px">쉬운 모드 (어르신용)</div><div class="t3">큰 노크 버튼 하나와 가족 소식만 크게 보여요</div></div><div class="sp"></div>' +
      '<button class="mini" id="easyOn" style="background:#14284b;color:#fff;padding:10px 14px">켜기</button></div>';
    document.getElementById('easyOn').onclick = function () { LS('tt-easy', '1'); start(); };
  }

  window.ttEasy = { start: function () { LS('tt-easy', '1'); start(); }, stop: function () { LS('tt-easy', '0'); stop(); } };
  window.addEventListener('load', function () { settingRow(); setTimeout(start, 600); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && box) { box.__last = ''; render(); } });
})();
