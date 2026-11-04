// 또옥또옥 오늘 컨디션 + '앱 열면 무사'
// - 노크한 뒤 좋음/그냥/별로를 고를 수 있어요 ('별로'면 노크방 사람들에게 전화 권유 알림)
// - 앱을 열면 서버에 '마지막으로 연 시각'을 남겨요. 노크가 없어도 앱을 열었으면 가족 알림을 보내지 않아요.
(function () {
  var NAMES = { 1: '좋음', 2: '그냥', 3: '별로' };
  var COLORS = { 1: '#1f7a3a', 2: '#5a6577', 3: '#b03a2e' };
  var FACES = {
    1: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="#e6f5ea" stroke="#23324a" stroke-width="1.5"/><circle cx="7" cy="8.5" r="1.2" fill="#23324a"/><circle cx="13" cy="8.5" r="1.2" fill="#23324a"/><path d="M6.5 12 Q10 15.5 13.5 12" fill="none" stroke="#23324a" stroke-width="1.5" stroke-linecap="round"/></svg>',
    2: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="#eef1f5" stroke="#23324a" stroke-width="1.5"/><circle cx="7" cy="8.5" r="1.2" fill="#23324a"/><circle cx="13" cy="8.5" r="1.2" fill="#23324a"/><path d="M7 13 H13" fill="none" stroke="#23324a" stroke-width="1.5" stroke-linecap="round"/></svg>',
    3: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="#fde8e6" stroke="#23324a" stroke-width="1.5"/><circle cx="7" cy="8.5" r="1.2" fill="#23324a"/><circle cx="13" cy="8.5" r="1.2" fill="#23324a"/><path d="M6.5 14 Q10 10.5 13.5 14" fill="none" stroke="#23324a" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };
  function LS(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function today() { var d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10); } // 한국 날짜
  function me() { try { return (JSON.parse(LS('ttokttok-auth-v1') || 'null') || {}).user_id; } catch (e) { return null; } }
  function myMood() { try { var o = JSON.parse(LS('tt-mood') || 'null'); return o && o.day === today() ? o.mood : 0; } catch (e) { return 0; } }
  function toast(t) { var e = document.getElementById('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { e.classList.remove('on'); }, 2600); }

  // 노크방 목록에 붙는 표시 (번들에서 불러요)
  window.__ttMoodTag = function (uid, isMe) {
    var m = (window.__ttMood || {})[uid] || (isMe ? myMood() : 0);
    return m ? ' · ' + (m === 3 ? '<b style="color:' + COLORS[3] + '">' + NAMES[m] + '</b>' : NAMES[m]) : '';
  };
  window.__ttSeenTag = function (mem) {
    if (!mem || !mem.last_seen_at) return '';
    var h = (Date.now() - Date.parse(mem.last_seen_at)) / 3600e3;
    if (!(h >= 0) || h > (mem.threshold_hours || 48)) return '';
    var t = h < 1 ? '방금 전' : h < 24 ? Math.floor(h) + '시간 전' : Math.floor(h / 24) + '일 전';
    return '<div class="t3" style="margin-top:3px">앱은 ' + t + '에 열었어요</div>';
  };

  // 오늘 컨디션 고르기
  function box() {
    var b = document.getElementById('moodBox');
    if (b) return b;
    var cap = document.getElementById('knockCap');
    if (!cap) return null;
    b = document.createElement('div');
    b.id = 'moodBox';
    b.style.cssText = 'display:none;margin:10px auto 0;max-width:340px;text-align:center';
    cap.parentNode.insertBefore(b, cap.nextSibling);
    return b;
  }
  function render() {
    var b = box(), pung = document.getElementById('pung');
    if (!b) return;
    var done = pung && pung.classList.contains('done');
    if (!done) { b.style.display = 'none'; return; }
    b.style.display = 'block';
    var m = myMood();
    if (m && !render.edit) {
      b.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;font-size:13.5px;color:#23324a">' + FACES[m] +
        '오늘 컨디션: <b style="color:' + COLORS[m] + '">' + NAMES[m] + '</b>' +
        '<button id="moodEdit" style="border:0;background:none;color:#5a6577;text-decoration:underline;font:inherit;font-size:12.5px;padding:2px 4px">바꾸기</button></div>';
      document.getElementById('moodEdit').onclick = function () { render.edit = true; render(); };
      return;
    }
    b.innerHTML = '<div style="font-size:13.5px;color:#23324a;margin-bottom:6px">오늘 컨디션은? <span style="color:#8a94a6;font-size:12px">(안 골라도 괜찮아요)</span></div>' +
      '<div style="display:flex;gap:8px;justify-content:center">' + [1, 2, 3].map(function (k) {
        return '<button data-mood="' + k + '" style="display:inline-flex;align-items:center;gap:5px;border:1.5px solid ' + (m === k ? COLORS[k] : '#c9cfd8') +
          ';background:#fff;border-radius:999px;padding:7px 13px;font:inherit;font-size:14px;color:#23324a">' + FACES[k] + NAMES[k] + '</button>';
      }).join('') + '</div>';
    Array.prototype.forEach.call(b.querySelectorAll('button[data-mood]'), function (btn) {
      btn.onclick = function () { pick(+btn.getAttribute('data-mood')); };
    });
  }
  async function pick(k) {
    try {
      if (!window.__ttRpc) throw new Error('잠시 뒤 다시 눌러 주세요');
      await window.__ttRpc('set_mood', { p_mood: k });
      LS('tt-mood', JSON.stringify({ day: today(), mood: k }));
      var u = me(); if (u) { window.__ttMood = window.__ttMood || {}; window.__ttMood[u] = k; }
      render.edit = false; render();
      toast(k === 3 ? '‘별로’를 전했어요 · 노크방 사람들이 안부를 물어올 거예요' : '오늘 컨디션을 전했어요');
    } catch (e) { toast((e && e.message || '컨디션을 전하지 못했어요').replace(/^[A-Z_]+:\s*/, '')); }
  }

  // 앱을 열었다는 기록 (10분에 한 번만)
  async function seen() {
    if (document.hidden || !window.__ttRpc) return;
    if (Date.now() - +(LS('tt-seen-at') || 0) < 6e5) return;
    LS('tt-seen-at', String(Date.now()));
    try { await window.__ttRpc('touch_seen', {}); } catch (e) {}
  }

  window.addEventListener('load', function () {
    var pung = document.getElementById('pung');
    render();
    if (pung && 'MutationObserver' in window) new MutationObserver(render).observe(pung, { attributes: true, attributeFilter: ['class'] });
    setTimeout(seen, 3000);
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(seen, 1500); });
})();
