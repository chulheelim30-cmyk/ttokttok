// 톡톡 오늘 컨디션 + '앱 열면 무사'
// - 노크한 뒤 아주 좋음/좋음/그냥/별로/힘들어요 5가지 중 고를 수 있어요 ('별로'면 노크방 사람들에게 전화 권유 알림)
// - 앱을 열면 서버에 '마지막으로 연 시각'을 남겨요. 노크가 없어도 앱을 열었으면 가족 알림을 보내지 않아요.
(function () {
  // 값은 예전과 호환: 1 좋음 · 2 그냥 · 3 별로 + 4 아주 좋음 · 5 힘들어요 (3·5 = 안 좋음)
  var NAMES = { 4: '아주 좋음', 1: '좋음', 2: '그냥', 3: '별로', 5: '힘들어요' };
  var ORDER = [4, 1, 2, 3, 5];
  var COLORS = { 4: '#1f7a3a', 1: '#3f8f55', 2: '#5a6577', 3: '#c0623a', 5: '#b03a2e' };
  function low(m) { return m === 3 || m === 5; }
  var FACES = {
    4: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="#d9f0df" stroke="#23324a" stroke-width="1.5"/><path d="M5.6 8.8 Q7 7 8.4 8.8 M11.6 8.8 Q13 7 14.4 8.8" fill="none" stroke="#23324a" stroke-width="1.4" stroke-linecap="round"/><path d="M6 11.3 H14 Q13.4 15.6 10 15.6 Q6.6 15.6 6 11.3 Z" fill="#23324a"/></svg>',
    5: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="#f9d9d5" stroke="#23324a" stroke-width="1.5"/><path d="M5.8 7.6 L8.2 8.6 M14.2 7.6 L11.8 8.6" fill="none" stroke="#23324a" stroke-width="1.4" stroke-linecap="round"/><circle cx="7" cy="9.8" r="1.1" fill="#23324a"/><circle cx="13" cy="9.8" r="1.1" fill="#23324a"/><path d="M6.8 14.8 Q10 11.6 13.2 14.8" fill="none" stroke="#23324a" stroke-width="1.5" stroke-linecap="round"/><path d="M14.3 11.4 Q13.4 13 14.3 13.6 Q15.2 13 14.3 11.4 Z" fill="#6aa7d8"/></svg>',
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
    return m ? ' · ' + (low(m) ? '<b style="color:' + COLORS[m] + '">' + NAMES[m] + '</b>' : NAMES[m]) : '';
  };
  window.__ttSeenTag = function (mem) {
    if (!mem || !mem.last_seen_at) return '';
    var h = (Date.now() - Date.parse(mem.last_seen_at)) / 3600e3;
    if (!(h >= 0)) return '';
    var t = h < 1 ? '방금 전' : h < 24 ? Math.floor(h) + '시간 전' : Math.floor(h / 24) + '일 전';
    return '<div class="t3" style="margin-top:3px">앱은 ' + t + '에 열었어요</div>';
  };

  // 이번 주 컨디션 7칸 (노크방 목록 이름 아래)
  var week = {}, weekRoom = null, DOT = { 1: '#4caf6d', 2: '#b7bfcc', 3: '#e05a4a' };
  function days7() { var o = []; for (var i = 6; i >= 0; i--) { o.push(new Date(Date.now() + 9 * 3600e3 - i * 864e5).toISOString().slice(0, 10)); } return o; }
  window.__ttMoodWeek = function () { return ''; }; // 이름 옆 7일 점은 쓰지 않아요 (주간 알림으로 대신)
  function weekDotsUnused(uid) {
    var w = week[uid]; if (!w) return '';
    var d = days7();
    return '<span style="display:inline-flex;gap:3px;margin-left:6px;vertical-align:1px" title="최근 7일 컨디션">' + d.map(function (x) {
      var v = w[x];
      var st = v === undefined ? 'background:transparent;border:1.5px solid #dfe3ea' : v === 0 ? 'background:#e8ecf2' : 'background:' + DOT[v];
      return '<i style="width:8px;height:8px;border-radius:50%;display:inline-block;' + st + '"></i>';
    }).join('') + '</span>';
  };
  async function loadWeek() {
    var r = window.__ttRoom; if (!r || !window.__ttAuth) return;
    try {
      var t = await window.__ttAuth(), d = days7();
      var res = await fetch('https://pbmocpzclvndlevuvfto.supabase.co/rest/v1/knocks?room_id=eq.' + r.id + '&day=gte.' + d[0] + '&select=user_id,day,mood',
        { headers: { apikey: 'sb_publishable_H42uVMl_0JG6NwuWhczkXw_85g9oaPi', Authorization: 'Bearer ' + t } });
      if (!res.ok) return;
      var rows = await res.json(), next = {};
      rows.forEach(function (x) { next[x.user_id] = next[x.user_id] || {}; next[x.user_id][x.day] = x.mood || 0; });
      var changed = JSON.stringify(next) !== JSON.stringify(week);
      week = next; weekRoom = r.id;
      if (changed && window.__ttRerender) window.__ttRerender();
    } catch (e) {}
  }

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
    b.innerHTML = '<div style="font-size:15px;font-weight:800;color:#23324a;margin-bottom:8px">오늘 컨디션은 어때요? <span style="color:#8a94a6;font-size:12px;font-weight:500">(안 골라도 돼요)</span></div>' +
      '<div style="display:flex;gap:5px;justify-content:center">' + ORDER.map(function (k) {
        return '<button data-mood="' + k + '" style="display:inline-flex;align-items:center;gap:5px;border:1.5px solid ' + (m === k ? COLORS[k] : '#c9cfd8') +
          ';background:#fff;border-radius:14px;padding:9px 2px;font:inherit;font-size:12.5px;font-weight:700;color:#23324a;flex:1;min-width:0;flex-direction:column;gap:4px;white-space:nowrap">' + FACES[k].replace(/width="18" height="18"/, 'width="32" height="32"') + NAMES[k] + '</button>';
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
      var say = { 4: '최고다옹! 좋은 기운 나눠 줘', 1: '좋다옹! 오늘도 반가워', 2: '그냥 그런 날도 있지', 3: '토닥토닥… 노크방에 알렸어', 5: '많이 힘들었구나… 노크방에 알렸어, 혼자 아니야' }[k];
      var u2 = me(); if (u2) { if (window.__ttRerender) window.__ttRerender(); }
      setTimeout(function () { var h = document.getElementById('knockHead'); if (h) h.textContent = say; }, 80);
      toast(low(k) ? '‘' + NAMES[k] + '’를 전했어요 · 노크방 사람들이 안부를 물어올 거예요' : '오늘 컨디션을 전했어요');
    } catch (e) { toast((e && e.message || '컨디션을 전하지 못했어요').replace(/^[A-Z_]+:\s*/, '')); }
  }

  // 토닥토닥 🤍: 오늘 컨디션이 안 좋은 사람에게 하루 한 번 (세지 않아요)
  var patSent = {}, patDay = '';
  async function loadPatSent() {
    if (!window.__ttRpc) return;
    try { var r = await window.__ttRpc('my_pats_sent', {}); patSent = {}; patDay = today(); (r || []).forEach(function (x) { patSent[x.to_user] = 1; }); if (window.__ttRerender) window.__ttRerender(); } catch (e) {}
  }
  window.__ttPatBtn = function (uid, isMe) {
    if (isMe) return '';
    if (patDay !== today()) { patDay = today(); patSent = {}; setTimeout(loadPatSent, 0); }
    if (!low((window.__ttMood || {})[uid])) return '';
    var st = 'margin-left:6px;border:0;border-radius:12px;padding:4px 9px;font:inherit;font-size:12px;font-weight:700;';
    return patSent[uid] ? '<span class="mini" style="' + st + 'background:#f3eee6;color:#8a7f70">토닥토닥</span>'
      : '<button class="mini" style="' + st + 'background:#fbe9ec;color:#b0475e" onclick="__ttPat(\'' + uid + '\')">토닥토닥 <svg viewBox="0 0 24 24" width="13" height="13" style="vertical-align:-2px" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.5h2c.7-1.3 2.2-2.5 4.3-2.5 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="#e8577a"/></svg></button>';
  };
  window.__ttPat = async function (uid) {
    var r = window.__ttRoom; if (!r || !window.__ttRpc || patSent[uid]) return;
    try {
      await window.__ttRpc('send_pat', { p_room: r.id, p_to: uid });
      patSent[uid] = 1; if (navigator.vibrate) navigator.vibrate([20, 60, 20]);
      if (window.__ttRerender) window.__ttRerender();
      toast('토닥토닥 💗 마음을 전했어요');
    } catch (e) { toast((e && e.message || '보내지 못했어요').replace(/^[A-Z_]+:\s*/, '')); }
  };
  // 받은 토닥토닥 보여 주기
  async function checkPats() {
    if (document.hidden || !window.__ttRpc || Date.now() - (checkPats.t || 0) < 6e4) return;
    checkPats.t = Date.now();
    try {
      var rows = await window.__ttRpc('my_pats', {}); if (!rows || !rows.length) return;
      var names = rows.map(function (x) { return x.from_name; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      var who = names.length > 2 ? names.slice(0, 2).join('님, ') + '님 외 ' + (names.length - 2) + '명' : names.join('님, ') + '님';
      var o = document.createElement('div');
      o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(35,50,74,.35);display:flex;align-items:center;justify-content:center;padding:24px';
      o.innerHTML = '<div style="background:#fffaf3;border-radius:22px;padding:26px 22px 18px;max-width:320px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.18)">' +
        '<div style="font-size:46px;line-height:1;animation:ttPat 1.2s ease-in-out 2"><svg viewBox="0 0 24 24" width="52" height="52" style="vertical-align:middle" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.5h2c.7-1.3 2.2-2.5 4.3-2.5 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="#e8577a"/></svg></div>' +
        '<div style="font-size:19px;font-weight:800;color:#23324a;margin:12px 0 6px">토닥토닥</div>' +
        '<div style="font-size:14.5px;color:#4a5568;line-height:1.55">' + who.replace(/</g, '&lt;') + '이<br>토닥토닥 해 줬어요.<br>오늘은 조금 쉬어 가요.</div>' +
        '<button style="margin-top:16px;border:0;border-radius:14px;background:#7a9a7e;color:#fff;font:inherit;font-size:15px;font-weight:700;padding:11px 0;width:100%">고마워요</button></div>' +
        '<style>@keyframes ttPat{0%,100%{transform:scale(1)}30%{transform:scale(1.18)}60%{transform:scale(.95)}}</style>';
      o.onclick = function (ev) { if (ev.target === o || ev.target.tagName === 'BUTTON') o.remove(); };
      document.body.appendChild(o);
    } catch (e) {}
  }

  // 앱을 열었다는 기록 (10분에 한 번만)
  async function seen(force) {
    if (document.hidden || !window.__ttRpc) return;
    var k = 'tt-seen-at-' + (me() || '');
    if (force !== true && Date.now() - +(LS(k) || 0) < 6e5) return;
    LS(k, String(Date.now()));
    try { await window.__ttRpc('touch_seen', {}); } catch (e) {}
  }

  window.addEventListener('load', function () {
    var pung = document.getElementById('pung');
    render();
    if (pung && 'MutationObserver' in window) new MutationObserver(render).observe(pung, { attributes: true, attributeFilter: ['class'] });
    setTimeout(seen, 3000);
    setTimeout(checkPats, 3500); setTimeout(loadPatSent, 4000);
    // 앱을 껐다 켜지 않고 다시 볼 때도 접속 시각을 남겨요
    document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(seen, 1500); });
    var aj = window.__ttAfterJoin; window.__ttAfterJoin = function (r) { if (aj) aj.apply(this, arguments); setTimeout(function () { seen(true); }, 2000); };
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { setTimeout(seen, 1500); setTimeout(checkPats, 2000); } });
})();
