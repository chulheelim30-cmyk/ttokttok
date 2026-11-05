// 또옥또옥 노크방 종류 + 참여 인원
// 방을 만들 때 가족 / 친구·크루 / 모임을 고르고, 들어올 수 있는 인원(2~30명)을 정해요.
// 방장은 '노크방 관리'에서 언제든 바꿀 수 있어요.
(function () {
  var TYPES = {
    family: { name: '가족', desc: '따로 사는 가족 · 소식이 48시간 없으면 알려요', max: 8 },
    crew: { name: '친구·크루', desc: '친구·동호회·팸 · 72시간으로 느슨하게, 그림은 함께', max: 30 },
    group: { name: '모임', desc: '동기·동네·소모임 · 소식이 48시간 없으면 알려요', max: 10 }
  };
  var ORDER = ['family', 'crew', 'group'];
  function toast(t) { var e = document.getElementById('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // 노크방 화면 오른쪽 위 칩: "가족 · 3/8명"
  window.__ttRoomChip = function (n) {
    var r = window.__ttRoom || {};
    var t = TYPES[r.room_type] ? TYPES[r.room_type].name + ' · ' : '';
    return t + n + (r.max_members ? '/' + r.max_members : '') + '명';
  };

  // 방 종류 + 인원 고르는 칸 (만들기와 관리에서 같이 써요)
  function picker(prefix, type, max, min) {
    return '<div class="sec" style="margin-top:14px">방 종류</div>' +
      '<div style="display:flex;gap:8px" id="' + prefix + 'Types">' + ORDER.map(function (k) {
        return '<button type="button" data-type="' + k + '" style="flex:1;border:1.5px solid ' + (k === type ? '#14284b' : '#c9cfd8') +
          ';background:' + (k === type ? '#14284b' : '#fff') + ';color:' + (k === type ? '#fff' : '#23324a') +
          ';border-radius:12px;padding:10px 4px;font:inherit;font-size:14px;font-weight:700">' + TYPES[k].name + '</button>';
      }).join('') + '</div>' +
      '<div class="t3" style="margin-top:6px" id="' + prefix + 'Desc">' + esc(TYPES[type].desc) + '</div>' +
      '<div class="sec" style="margin-top:14px">참여 인원 <span id="' + prefix + 'MaxTxt" style="color:#14284b">' + max + '명</span></div>' +
      '<input type="range" min="' + (min || 2) + '" max="30" step="1" value="' + max + '" id="' + prefix + 'Max" style="width:100%">' +
      '<div class="row t3"><span>' + (min || 2) + '명</span><div class="sp"></div><span>30명</span></div>';
  }
  function wire(prefix, state, onChange) {
    var types = document.getElementById(prefix + 'Types'), range = document.getElementById(prefix + 'Max');
    Array.prototype.forEach.call(types.querySelectorAll('button'), function (b) {
      b.onclick = function () {
        state.type = b.getAttribute('data-type');
        if (state.autoMax) state.max = Math.max(state.min || 2, TYPES[state.type].max);
        onChange();
      };
    });
    range.oninput = function () { state.max = +range.value; state.autoMax = false; document.getElementById(prefix + 'MaxTxt').textContent = state.max + '명'; sync(); };
    function sync() { if (state.onSync) state.onSync(); }
  }

  // 새 노크방 만들기
  var create = { type: 'family', max: TYPES.family.max, autoMax: true };
  create.onSync = function () { window.__ttNewRoom = { p_room_type: create.type, p_max_members: create.max }; };
  function renderCreate() {
    var box = document.getElementById('createExtra');
    if (!box) {
      var input = document.getElementById('roomNameInput');
      if (!input) return;
      box = document.createElement('div'); box.id = 'createExtra';
      input.parentNode.insertBefore(box, input.nextSibling);
    }
    box.innerHTML = picker('cr', create.type, create.max);
    wire('cr', create, renderCreate);
    create.onSync();
  }

  // 노크방 관리 (방장)
  var manage = {};
  manage.onSync = function () {};
  function renderManage() {
    var owner = document.getElementById('ownerBox'), r = window.__ttRoom;
    if (!owner || !r) return;
    var box = document.getElementById('manageExtra');
    if (!box) { box = document.createElement('div'); box.id = 'manageExtra'; owner.appendChild(box); }
    box.innerHTML = picker('mg', manage.type, manage.max, manage.min) +
      '<button class="btn bs" style="margin-top:10px;padding:12px" id="mgSave">방 종류·인원 저장</button>' +
      '<div class="t3" style="margin-top:6px">지금 ' + manage.min + '명이 있어서 그보다 적게는 못 줄여요 · 바꾼 기준 시간은 새로 들어오는 사람부터 적용돼요</div>';
    wire('mg', manage, renderManage);
    document.getElementById('mgSave').onclick = saveManage;
  }
  async function saveManage() {
    var r = window.__ttRoom;
    try {
      if (!window.__ttRpc) throw new Error('잠시 뒤 다시 눌러 주세요');
      var res = await window.__ttRpc('update_room_settings', { p_room: r.id, p_room_type: manage.type, p_max_members: manage.max });
      r.room_type = manage.type; r.max_members = (res && res.max_members) || manage.max;
      var c = document.getElementById('roomCnt'); if (c) c.textContent = window.__ttRoomChip(manage.min);
      toast('‘' + TYPES[manage.type].name + '’ 방 · 최대 ' + r.max_members + '명으로 바꿨어요');
    } catch (e) { toast((e && e.message || '바꾸지 못했어요').replace(/^[A-Z_]+:\s*/, '')); }
  }
  function memberCount() {
    var c = document.getElementById('roomCnt'), m = c && c.textContent.match(/(\d+)(?:\/\d+)?명/);
    return m ? +m[1] : 2;
  }

  window.addEventListener('load', function () {
    var oc = window.openCreate, om = window.openManage;
    if (typeof oc === 'function') window.openCreate = function () {
      create = { type: 'family', max: TYPES.family.max, autoMax: true, onSync: create.onSync };
      var r = oc.apply(this, arguments); renderCreate(); return r;
    };
    if (typeof om === 'function') window.openManage = function () {
      var r = om.apply(this, arguments), room = window.__ttRoom || {};
      var n = memberCount();
      manage = { type: TYPES[room.room_type] ? room.room_type : 'family', max: room.max_members || 30, min: Math.max(2, n), autoMax: false, onSync: function () {} };
      renderManage(); return r;
    };
    // 만들기 창이 닫히면 다음 만들기에 남지 않게
    var cs = document.getElementById('createSheet');
    if (cs && 'MutationObserver' in window) new MutationObserver(function () { if (!cs.classList.contains('on')) setTimeout(function () { window.__ttNewRoom = null; }, 1500); }).observe(cs, { attributes: true, attributeFilter: ['class'] });
  });
})();

// 플러스 '숨은 그림 미리 보기': 그림 창 안에서만 잠깐 보여 주고, 닫으면 다시 흐려져요
(function () {
  window.ttPeekPic = function () {
    var plus = window.__ttIsPlus && window.__ttIsPlus();
    if (!plus) { if (window.closePic) closePic(); if (window.openPlus) openPlus(); return; }
    var n = window.__ttPicNow ? window.__ttPicNow() : 0;
    window.__ttPeek = n;
    if (window.__ttPicTap) window.__ttPicTap(n);
    var b = document.getElementById('picBuy'); if (b) b.style.display = 'none';
  };
  window.addEventListener('load', function () {
    var cp = window.closePic;
    if (typeof cp === 'function') window.closePic = function () { window.__ttPeek = null; return cp.apply(this, arguments); };
    var ps = document.getElementById('picSheet');
    if (ps && 'MutationObserver' in window) new MutationObserver(function () { if (!ps.classList.contains('on')) window.__ttPeek = null; }).observe(ps, { attributes: true, attributeFilter: ['class'] });
  });
})();

// 방장에게만 보이는 실명
// - 구성원: 노크방에 들어오면 한 번 "방장이 알아볼 수 있게 실명을 알려 줄까요?"를 물어요 (안 적어도 돼요).
//           '노크방 관리'에서 언제든 바꾸거나 지울 수 있어요.
// - 방장: 노크방 목록과 관리 화면에서 별명 옆에 실명이 보여요.
(function () {
  var names = {}, loadedRoom = null;
  function LS(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t) { var e = document.getElementById('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  function room() { return window.__ttRoom || null; }
  function isOwner() { var r = room(); return !!(r && window.__ttMe && r.created_by === window.__ttMe()); }

  window.__ttRealTag = function (uid) {
    var n = names[uid];
    return n ? '<span style="font-weight:600;color:#5a6577;font-size:12.5px;margin-left:6px">(' + esc(n) + ')</span>' : '';
  };

  async function loadOwnerNames() {
    var r = room(); if (!r || !window.__ttRpc) return;
    if (!isOwner()) { if (Object.keys(names).length) { names = {}; window.__ttRerender && window.__ttRerender(); } loadedRoom = r.id; return; }
    try {
      var rows = await window.__ttRpc('room_real_names', { p_room: r.id });
      var next = {}; (rows || []).forEach(function (x) { if (x.real_name) next[x.user_id] = x.real_name; });
      var changed = JSON.stringify(next) !== JSON.stringify(names);
      names = next; loadedRoom = r.id;
      if (changed && window.__ttRerender) window.__ttRerender();
    } catch (e) {}
  }

  // 구성원에게 한 번 물어보기
  function askSheet(mine) {
    var s = document.getElementById('realSheet');
    if (!s) {
      s = document.createElement('div'); s.className = 'sheet'; s.id = 'realSheet';
      s.innerHTML = '<div class="dim" data-x></div><div class="pan"><div class="grab"></div>' +
        '<div class="top"><div class="logo" style="font-size:18px">방장에게 실명 알려 주기</div></div>' +
        '<div style="padding:0 18px"><div class="t2" style="line-height:1.7" id="realLead"></div>' +
        '<input class="inp" id="realInput" maxlength="20" autocomplete="name" placeholder="예: 홍길동" style="margin-top:12px">' +
        '<button class="btn bp" style="margin-top:12px" id="realSave">알려 주기</button>' +
        '<button class="btn bw" style="margin-top:8px" data-x>안 알려 줄래요</button>' +
        '<div class="t3" style="text-align:center;margin-top:8px">방장에게만 보여요 · 노크방 관리에서 언제든 지울 수 있어요</div></div></div>';
      document.body.appendChild(s);
      Array.prototype.forEach.call(s.querySelectorAll('[data-x]'), function (b) { b.onclick = function () { s.classList.remove('on'); }; });
      document.getElementById('realSave').onclick = save;
    }
    var r = room();
    document.getElementById('realLead').innerHTML = '‘' + esc(r && r.name || '노크방') + '’ 방장이 누구인지 알아볼 수 있게 실명을 알려 줄까요?<br><span class="t3">다른 구성원에게는 별명만 보여요. 안 적어도 괜찮아요.</span>';
    document.getElementById('realInput').value = mine || '';
    s.classList.add('on');
  }
  async function save() {
    var r = room(); if (!r) return;
    var v = document.getElementById('realInput').value.trim();
    try {
      await window.__ttRpc('set_real_name', { p_room: r.id, p_name: v });
      document.getElementById('realSheet').classList.remove('on');
      toast(v ? '방장에게만 실명을 알려 줬어요' : '실명을 지웠어요');
      var t = document.getElementById('realMineTxt'); if (t) t.textContent = v ? v + ' · 방장에게만 보여요' : '알려 주지 않았어요';
    } catch (e) { toast((e && e.message || '저장하지 못했어요').replace(/^[A-Z_]+:\s*/, '')); }
  }
  async function maybeAsk() {
    var r = room(); if (!r || isOwner() || !window.__ttRpc) return;
    var key = 'tt-real-asked-' + r.id;
    if (LS(key)) return;
    try {
      var mine = await window.__ttRpc('my_real_name', { p_room: r.id });
      LS(key, '1');
      if (!mine) askSheet('');
    } catch (e) {}
  }

  // 노크방 관리: 방장이 아닌 사람에게 '방장에게 보이는 내 실명' 줄
  function manageRow() {
    var r = room(); var owner = document.getElementById('ownerBox'); if (!r || !owner) return;
    var box = document.getElementById('realMine');
    if (isOwner()) { if (box) box.style.display = 'none'; return; }
    if (!box) {
      box = document.createElement('div'); box.id = 'realMine';
      box.innerHTML = '<div class="sec">방장에게 보이는 내 실명</div><div class="row" style="gap:8px"><div class="t3" style="flex:1" id="realMineTxt">불러오는 중…</div><button class="mini bs" id="realMineBtn">바꾸기</button></div>';
      owner.parentNode.insertBefore(box, owner.nextSibling);
    }
    box.style.display = '';
    window.__ttRpc('my_real_name', { p_room: r.id }).then(function (v) {
      document.getElementById('realMineTxt').textContent = v ? v + ' · 방장에게만 보여요' : '알려 주지 않았어요';
      document.getElementById('realMineBtn').onclick = function () { askSheet(v || ''); };
    }).catch(function () {});
  }

  window.addEventListener('load', function () {
    var om = window.openManage;
    if (typeof om === 'function') window.openManage = function () { var x = om.apply(this, arguments); manageRow(); loadOwnerNames(); return x; };
    // 방이 바뀌거나 앱을 다시 열 때마다 확인
    var last = null;
    setInterval(function () {
      var r = room(); if (!r) return;
      if (r.id !== last) { last = r.id; names = {}; loadOwnerNames(); setTimeout(maybeAsk, 2500); }
    }, 1500);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loadOwnerNames(); });
  });
})();
