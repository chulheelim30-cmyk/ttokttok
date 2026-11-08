// 톡톡 노크방 종류 + 참여 인원
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
  function picker(prefix, type, max, min, fold) {
    var range = '<div class="sec" style="margin-top:14px">참여 인원 <span id="' + prefix + 'MaxTxt" style="color:#14284b">' + max + '명</span></div>' +
      '<input type="range" min="' + (min || 2) + '" max="30" step="1" value="' + max + '" id="' + prefix + 'Max" style="width:100%">' +
      '<div class="row t3"><span>' + (min || 2) + '명</span><div class="sp"></div><span>30명</span></div>';
    if (fold) range = '<details id="' + prefix + 'More"' + (fold === 'open' ? ' open' : '') + ' style="margin-top:10px"><summary class="t3" style="cursor:pointer">인원 직접 정하기 (지금 ' + max + '명)</summary>' + range + '</details>';
    return '<div class="sec" style="margin-top:14px">방 종류</div>' +
      '<div style="display:flex;gap:8px" id="' + prefix + 'Types">' + ORDER.map(function (k) {
        return '<button type="button" data-type="' + k + '" style="flex:1;border:1.5px solid ' + (k === type ? '#14284b' : '#c9cfd8') +
          ';background:' + (k === type ? '#14284b' : '#fff') + ';color:' + (k === type ? '#fff' : '#23324a') +
          ';border-radius:12px;padding:10px 4px;font:inherit;font-size:14px;font-weight:700">' + TYPES[k].name + '</button>';
      }).join('') + '</div>' +
      '<div class="t3" style="margin-top:6px" id="' + prefix + 'Desc">' + esc(TYPES[type].desc) + '</div>' + range;
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
    var input = document.getElementById('roomNameInput');
    // 한 번 누르면 이름 + 방 종류가 같이 정해지는 추천 칩
    var chips = document.getElementById('createChips');
    if (!chips && input) {
      chips = document.createElement('div'); chips.id = 'createChips';
      chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px';
      input.parentNode.insertBefore(chips, input);
      input.onkeydown = function (e) { if (e.key === 'Enter' && window.submitCreate) { e.preventDefault(); window.submitCreate(); } };
    }
    if (chips) {
      chips.innerHTML = QUICK.map(function (q, i) {
        var on = input && input.value === q.t;
        return '<button type="button" data-i="' + i + '" style="border:1.5px solid ' + (on ? '#14284b' : '#c9cfd8') + ';background:' + (on ? '#14284b' : '#fff') + ';color:' + (on ? '#fff' : '#23324a') + ';border-radius:999px;padding:7px 12px;font:inherit;font-size:13.5px;font-weight:700">' + esc(q.t) + '</button>';
      }).join('');
      Array.prototype.forEach.call(chips.querySelectorAll('button'), function (b) {
        b.onclick = function () {
          var q = QUICK[+b.getAttribute('data-i')];
          if (input) input.value = q.t;
          create.type = q.k;
          if (create.autoMax) create.max = TYPES[q.k].max;
          renderCreate();
        };
      });
    }
    var more = document.getElementById('crMore');
    box.innerHTML = picker('cr', create.type, create.max, 2, more && more.open ? 'open' : 1);
    wire('cr', create, renderCreate);
    create.onSync();
  }
  var QUICK = [{ t: '우리 가족', k: 'family' }, { t: '친구들', k: 'crew' }, { t: '러닝 크루', k: 'crew' }, { t: '대학 동기', k: 'group' }, { t: '동네 모임', k: 'group' }];

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
// - 구성원: 노크방에 들어갈 때 별명과 함께 실명(선택)을 적어요. '노크방 관리'에서 언제든 바꾸거나 지울 수 있어요.
// - 방장: 노크방 목록과 관리 화면에서 별명 옆에 실명이 보여요.
(function () {
  var names = {}, loadedRoom = null, shown = {}, pickShow = false;
  function LS(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t) { var e = document.getElementById('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  function room() { return window.__ttRoom || null; }
  function isOwner() { var r = room(); return !!(r && window.__ttMe && r.created_by === window.__ttMe()); }

  window.__ttRealTag = function (uid) {
    var n = names[uid];
    return n ? '<span style="font-weight:600;color:#5a6577;font-size:12.5px;margin-left:6px">(' + esc(n) + ')</span>' : '';
  };

  // 본인이 '실명으로 보이기'를 고른 사람은 다른 구성원에게 실명으로 보여요 (방장은 별명+실명 함께)
  window.__ttDispName = function (uid, nick) { if (isOwner()) return nick; return shown[uid] || nick; };
  async function loadShown(r) {
    try {
      var sr = await window.__ttRpc('room_shown_names', { p_room: r.id });
      var ns = {}; (sr || []).forEach(function (x) { if (x.shown_name) ns[x.user_id] = x.shown_name; });
      if (JSON.stringify(ns) !== JSON.stringify(shown)) { shown = ns; window.__ttRerender && window.__ttRerender(); }
    } catch (e) {}
  }
  async function loadOwnerNames() {
    var r = room(); if (!r || !window.__ttRpc) return;
    loadShown(r);
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
        '<div class="top"><div class="logo" style="font-size:18px">실명 등록하기</div></div>' +
        '<div style="padding:0 18px"><div class="t2" style="line-height:1.7" id="realLead"></div>' +
        '<input class="inp" id="realInput" maxlength="20" autocomplete="name" placeholder="예: 홍길동" style="margin-top:12px">' +
        '<div class="t3" style="margin:14px 0 6px">다른 구성원에게 보일 이름</div>' +
        '<div id="realShowSeg" style="display:flex;gap:8px"><button class="btn bw" data-s="0" style="flex:1;margin:0">별명으로</button><button class="btn bw" data-s="1" style="flex:1;margin:0">실명으로</button></div>' +
        '<button class="btn bp" style="margin-top:14px" id="realSave">저장하기</button>' +
        '<button class="btn bw" style="margin-top:8px" data-x>다음에 할게요</button>' +
        '<div class="t3" style="text-align:center;margin-top:8px">방장에게는 별명과 실명이 함께 보여요 · 노크방 관리에서 언제든 바꿀 수 있어요</div></div></div>';
      (document.getElementById('app')||document.body).appendChild(s);
      Array.prototype.forEach.call(s.querySelectorAll('[data-x]'), function (b) { b.onclick = function () { s.classList.remove('on'); }; });
      document.getElementById('realSave').onclick = save;
      Array.prototype.forEach.call(s.querySelectorAll('#realShowSeg button'), function (b) { b.onclick = function () { setPick(b.getAttribute('data-s') === '1'); }; });
    }
    var r = room();
    document.getElementById('realLead').innerHTML = '‘' + esc(r && r.name || '노크방') + '’ 노크방에 실명을 등록해 주세요.<br><span class="t3">방장은 별명과 실명을 함께 보고, 다른 구성원에게는 아래에서 고른 이름이 보여요.</span>';
    document.getElementById('realInput').value = mine || '';
    var me = window.__ttMe && window.__ttMe(); setPick(!!(me && shown[me]));
    s.classList.add('on');
  }
  function setPick(v) {
    pickShow = v;
    Array.prototype.forEach.call(document.querySelectorAll('#realShowSeg button'), function (b) {
      var on = (b.getAttribute('data-s') === '1') === v;
      b.style.background = on ? '#1f5fa8' : ''; b.style.color = on ? '#fff' : '';
    });
  }
  async function save() {
    var r = room(); if (!r) return;
    var v = document.getElementById('realInput').value.trim();
    try {
      if (pickShow && !v) { toast('실명으로 보이려면 실명을 적어 주세요'); return; }
      await window.__ttRpc('set_real_name', { p_room: r.id, p_name: v });
      await window.__ttRpc('set_shown_name', { p_room: r.id, p_name: pickShow ? v : null });
      document.getElementById('realSheet').classList.remove('on');
      toast(v ? (pickShow ? '구성원에게 실명으로 보여요' : '구성원에게 별명으로 보여요') : '실명 없이 별명으로 보여요');
      var t = document.getElementById('realMineTxt'); if (t) t.textContent = mineTxt(v, pickShow);
      loadOwnerNames();
    } catch (e) { toast((e && e.message || '저장하지 못했어요').replace(/^[A-Z_]+:\s*/, '')); }
  }
  async function maybeAsk() {
    var r = room(); if (!r || !window.__ttRpc) return;
    var key = 'tt-real-asked2-' + r.id;
    if (LS(key) || isOwner()) return; // 방장은 자기 방에서 따로 묻지 않아요 (관리 화면에서 바꿀 수 있어요)
    try {
      var mine = await window.__ttRpc('my_real_name', { p_room: r.id });
      LS(key, '1');
      await loadShown(r); askSheet(mine || '');
    } catch (e) {}
  }

  // 노크방 관리: 방장이 아닌 사람에게 '방장에게 보이는 내 실명' 줄
  function manageRow() {
    var r = room(); var owner = document.getElementById('ownerBox'); if (!r || !owner) return;
    var box = document.getElementById('realMine');
    if (!box) {
      box = document.createElement('div'); box.id = 'realMine';
      box.innerHTML = '<div class="sec">내 실명 · 보이는 이름</div><div class="row" style="gap:8px"><div class="t3" style="flex:1" id="realMineTxt">불러오는 중…</div><button class="mini bs" id="realMineBtn">바꾸기</button></div>';
      owner.parentNode.insertBefore(box, owner.nextSibling);
    }
    box.style.display = '';
    window.__ttRpc('my_real_name', { p_room: r.id }).then(function (v) {
      var me = window.__ttMe && window.__ttMe();
      document.getElementById('realMineTxt').textContent = mineTxt(v, !!(me && shown[me]));
      document.getElementById('realMineBtn').onclick = function () { askSheet(v || ''); };
    }).catch(function () {});
  }

  function mineTxt(v, sh) { return v ? v + ' · 구성원에게 ' + (sh ? '실명' : '별명') + '으로 보여요' : '아직 등록하지 않았어요'; }

  // 입장할 때 적은 실명을 들어간 방에 저장해요
  var pending = '';
  window.__ttAfterJoin = function (r) {
    // 자동 완성으로 채워져 input 이벤트가 없을 때도 칸의 값을 읽어요
    var v = pending || '';
    ['onbRealInput', 'codeRealInput'].forEach(function (id) { var e = document.getElementById(id); if (e) { if (!v) v = e.value; e.value = ''; } });
    v = v.trim(); pending = '';
    if (!v || !r || !r.id || !window.__ttRpc) return;
    LS('tt-real-asked2-' + r.id, '1'); // 방금 적었으니 들어가자마자 또 묻지 않아요
    window.__ttRpc('set_real_name', { p_room: r.id, p_name: v }).then(function () { if (isOwner()) loadOwnerNames(); }).catch(function () {});
  };
  function bindInput(id) { var e = document.getElementById(id); if (e) e.addEventListener('input', function () { pending = e.value; }); }

  // 전화번호 초대 수락: 들어가기 전에 실명(선택)을 같이 받아요
  function inviteSheet(go) {
    var s = document.getElementById('invEnterSheet');
    if (!s) {
      s = document.createElement('div'); s.className = 'sheet'; s.id = 'invEnterSheet';
      s.innerHTML = '<div class="dim" data-x></div><div class="pan"><div class="grab"></div>' +
        '<div class="top"><div class="logo" style="font-size:18px">노크방 들어가기</div></div>' +
        '<div style="padding:0 18px"><div class="t3" style="margin-bottom:6px">별명 · 노크방에서 불릴 이름</div><div class="t1" id="invNick" style="font-size:16px"></div>' +
        '<div class="t3" style="margin:14px 0 6px">실명 · 방장에게만 보여요 (선택)</div>' +
        '<input class="inp" id="invRealInput" maxlength="20" autocomplete="name" placeholder="예: 홍길동 · 안 적어도 돼요">' +
        '<button class="btn bp" style="margin-top:12px" id="invGo">들어가기</button>' +
        '<button class="btn bw" style="margin-top:8px" data-x>그만두기</button></div></div>';
      (document.getElementById('app')||document.body).appendChild(s);
      Array.prototype.forEach.call(s.querySelectorAll('[data-x]'), function (b) { b.onclick = function () { s.classList.remove('on'); }; });
    }
    var nick = document.getElementById('myNameTxt');
    document.getElementById('invNick').textContent = (nick && nick.textContent) || '설정에서 바꿀 수 있어요';
    document.getElementById('invRealInput').value = '';
    document.getElementById('invGo').onclick = function () { pending = document.getElementById('invRealInput').value; s.classList.remove('on'); go(); };
    s.classList.add('on');
  }

  window.addEventListener('load', function () {
    var om = window.openManage;
    if (typeof om === 'function') window.openManage = function () { var x = om.apply(this, arguments); manageRow(); loadOwnerNames(); return x; };
    bindInput('onbRealInput'); bindInput('codeRealInput');
    // 설정 > 내 이름 바꾸기: 별명과 실명을 함께, 실명은 꼭 적어야 저장돼요
    var orn = window.openRename, srn = window.saveRename;
    if (typeof orn === 'function') window.openRename = function () {
      var x = orn.apply(this, arguments), ri = document.getElementById('renameRealInput'), r = room();
      if (ri) { ri.value = ''; if (r && window.__ttRpc) window.__ttRpc('my_real_name', { p_room: r.id }).then(function (v) { if (v && !ri.value) ri.value = v; }).catch(function () {}); }
      return x;
    };
    if (typeof srn === 'function') window.saveRename = function () {
      var ri = document.getElementById('renameRealInput'), v = ri ? ri.value.trim() : '', r = room();
      if (ri && !v) { toast('실명을 적어 주세요'); ri.focus(); return; }
      var x = srn.apply(this, arguments);
      if (v && r && window.__ttRpc) {
        var me = window.__ttMe && window.__ttMe();
        window.__ttRpc('set_real_name', { p_room: r.id, p_name: v }).then(function () {
          if (me && shown[me]) return window.__ttRpc('set_shown_name', { p_room: r.id, p_name: v }); // 실명으로 보이기를 고른 사람은 보이는 이름도 같이 바꿔요
        }).then(function () { loadOwnerNames(); }).catch(function (e) { toast((e && e.message || '실명을 저장하지 못했어요').replace(/^[A-Z_]+:\s*/, '')); });
      }
      return x;
    };
    // 초대받아 시작할 때만 실명 칸을 보여요
    var oj = document.getElementById('onbJoin'), box = document.getElementById('onbRealBox');
    function syncOnb() { if (oj && box) box.style.display = oj.style.display === 'block' ? '' : 'none'; }
    if (oj && 'MutationObserver' in window) { new MutationObserver(syncOnb).observe(oj, { attributes: true, attributeFilter: ['style'] }); syncOnb(); }
    var ai = window.acceptInvite;
    if (typeof ai === 'function') window.acceptInvite = function () { var self = this, args = arguments; inviteSheet(function () { ai.apply(self, args); }); };
    // 방이 바뀌거나 앱을 다시 열 때마다 확인
    var last = null;
    setInterval(function () {
      var r = room(); if (!r) return;
      if (r.id !== last) { last = r.id; names = {}; shown = {}; loadOwnerNames(); setTimeout(maybeAsk, 1200); }
    }, 1500);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loadOwnerNames(); });
  });
})();

// 그림 완성 순간: 완성된 그림이 2~3초 동안 번쩍이며 움직이고, 모든 칸이 열렸다고 알려 줘요
(function () {
  var css = '#ttCel{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,20,40,.88);animation:ttCelIn .25s ease-out}' +
    '#ttCel .fr{position:relative;width:min(82vw,380px);aspect-ratio:1;border-radius:18px;overflow:hidden;box-shadow:0 0 0 3px #ffd34d,0 10px 40px rgba(255,211,77,.45)}' +
    '#ttCel .tt-cel-img{width:100%;height:100%;object-fit:cover;animation:ttCelMove 2.8s ease-in-out forwards}' +
    '#ttCel .fl{position:absolute;inset:0;background:#fff;animation:ttCelFlash .7s ease-out forwards;pointer-events:none}' +
    '#ttCel .sh{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%);animation:ttCelShine 1.4s .5s ease-in-out 2;pointer-events:none}' +
    '#ttCel .tx{color:#fff;font-weight:800;font-size:20px;margin-top:20px;text-align:center;line-height:1.5}' +
    '#ttCel .tx small{display:block;font-size:13.5px;font-weight:600;color:#ffd34d}' +
    '#ttCel.out{animation:ttCelOut .4s ease-in forwards}' +
    '@keyframes ttCelIn{from{opacity:0}to{opacity:1}}@keyframes ttCelOut{to{opacity:0}}' +
    '@keyframes ttCelFlash{0%{opacity:.95}100%{opacity:0}}' +
    '@keyframes ttCelShine{to{transform:translateX(120%)}}' +
    '@keyframes ttCelMove{0%{transform:scale(1)}35%{transform:scale(1.1) rotate(-1.5deg)}70%{transform:scale(1.14) translate(2%,-2%) rotate(1deg)}100%{transform:scale(1.06)}}' +
    '@media (prefers-reduced-motion:reduce){#ttCel *{animation:none!important}}';
  var busy = false;
  window.__ttCelebrate = function (artHtml, no) {
    if (busy) return; busy = true;
    if (!document.getElementById('ttCelCss')) { var st = document.createElement('style'); st.id = 'ttCelCss'; st.textContent = css; document.head.appendChild(st); }
    var d = document.createElement('div'); d.id = 'ttCel';
    d.innerHTML = '<div class="fr">' + artHtml + '<div class="sh"></div><div class="fl"></div></div>' +
      '<div class="tx">모든 칸이 열렸어요!<small>노크방이 함께 완성한 ' + no + '번째 그림이에요</small></div>';
    d.onclick = done;
    document.body.appendChild(d);
    if (navigator.vibrate) try { navigator.vibrate([40, 40, 40, 40, 80]); } catch (e) {}
    var h = setTimeout(done, 2800);
    function done() { clearTimeout(h); d.classList.add('out'); setTimeout(function () { d.remove(); busy = false; }, 400); }
  };
})();

// 방장 관리 모드: 확인이 필요한 사람이 맨 위로 + "오늘 노크 n/N · 확인 필요 k명" 요약 + '확인 필요만 보기'
(function () {
  var onlyNeed = false;
  function hrs(t) { return t ? (Date.now() - new Date(t).getTime()) / 36e5 : Infinity; }
  window.__ttSortMembers = function (list, meKnocked, today) {
    var me = window.__ttMe ? window.__ttMe() : null, r = window.__ttRoom || {};
    var mood = window.__ttMood || {};
    function info(m) {
      var isMe = m.user_id === me || m.user_id === 'me';
      var knocked = isMe ? meKnocked : !!(today && today[m.user_id]);
      var lapsed = !knocked && !m.paused && m.last_knock_at && hrs(m.last_knock_at) >= (m.threshold_hours || 48);
      var rank = isMe ? 0 : lapsed ? 1 : (knocked && mood[m.user_id] === 3) ? 2 : !knocked && !m.paused ? 3 : 4;
      return { m: m, rank: rank, knocked: knocked, isMe: isMe };
    }
    var rows = list.map(info);
    var owner = !!(me && r.created_by === me);
    var bar = document.getElementById('careBar');
    if (!owner || list.length < 3) { if (bar) bar.style.display = 'none'; onlyNeed = false; return list; }
    var done = rows.filter(function (x) { return x.knocked; }).length;
    var need = rows.filter(function (x) { return !x.isMe && x.rank <= 2; }).length;
    var wait = rows.filter(function (x) { return !x.isMe && x.rank === 3; }).length;
    if (!bar) {
      var box = document.getElementById('members'); if (!box) return list;
      bar = document.createElement('div'); bar.id = 'careBar';
      bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;margin:0 0 8px;border-radius:12px;background:#f4f7fc;font-size:13.5px;line-height:1.5';
      box.parentNode.insertBefore(bar, box);
    }
    bar.style.display = 'flex';
    bar.innerHTML = '<div style="flex:1"><b>오늘 노크 ' + done + '/' + list.length + '명</b>' +
      (need ? ' · <b style="color:#c0392b">확인 필요 ' + need + '명</b>' : ' · 확인 필요 없음') +
      (wait ? '<br><span style="color:#5a6577">아직 노크 전 ' + wait + '명</span>' : '') + '</div>' +
      '<button type="button" id="careOnly" style="border:1.5px solid #14284b;background:' + (onlyNeed ? '#14284b' : '#fff') + ';color:' + (onlyNeed ? '#fff' : '#14284b') + ';border-radius:999px;padding:6px 10px;font:inherit;font-size:12.5px;font-weight:700">' + (onlyNeed ? '전체 보기' : '확인 필요만') + '</button>';
    document.getElementById('careOnly').onclick = function () { onlyNeed = !onlyNeed; if (window.__ttRerender) window.__ttRerender(); };
    rows.sort(function (a, b) { return a.rank - b.rank; });
    if (onlyNeed) rows = rows.filter(function (x) { return x.isMe || x.rank <= 3; });
    return rows.map(function (x) { return x.m; });
  };
})();

// 업데이트 소식: 새 버전이면 한 번 보여 주고, 설정에서 언제든 다시 볼 수 있어요
(function () {
  var VER = '베타4';
  var NOTES = [
    { v: '베타4 업그레이드 완료', d: '2026.11.08', items: [
      "노크·접속 시간이 '28시간 전'처럼 시간으로 보여요",
      '설정 › 내 이름에서 실명도 함께 등록해요',
      '그림첩: 잠긴 그림이 덜 흐려졌어요, 열린 그림은 휴대폰에 저장할 수 있어요',
      '설정 화면이 옆으로 밀리던 오류 수정'
    ] },
    { v: '베타3', d: '2026.11.08', items: [
      '앱 이름이 ‘톡톡’으로 바뀌었어요',
      '더 깔끔하고 밝은 새 디자인',
      '풍년이 수채화 그림 12장 · 열릴 때 3초 동안 움직여요',
      '실명 등록: 방장에게는 별명과 실명이 함께 보여요',
      '다른 구성원에게 별명·실명 중 무엇을 보일지 직접 골라요',
      '업데이트 소식 창이 비쳐 보이던 오류 수정',
      '그림첩: 열린 그림을 휴대폰에 저장할 수 있어요 · 잠긴 그림은 더 흐리게'
    ] },
    { v: '베타2', d: '2026.11.08', items: [
      '모든 기능 무료 (구독 없음)',
      '방장 관리 화면: 확인 필요한 사람이 위로, ‘확인 필요만’ 보기',
      '방 만들기 쉬워짐: 추천 이름 버튼, Enter로 바로 만들기',
      '황금 칸은 그림의 마지막 칸 1개',
      '그림 완성 시 2~3초 효과 + 방 사람 모두에게 알림',
      '베타 그림을 일러스트로 변경',
      '그림이 넘어갈 때 칸 순서가 바뀌던 오류 수정',
      '새 버전이 나오면 자동으로 업데이트',
      '노크방 목록에 마지막 접속 시간 표시'
    ] }
  ];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function open() {
    var s = document.getElementById('notesSheet');
    if (!s) {
      s = document.createElement('div'); s.className = 'sheet'; s.id = 'notesSheet';
      s.innerHTML = '<div class="dim" data-x></div><div class="pan"><div class="grab"></div>' +
        '<div class="top"><div class="logo" style="font-size:18px">업데이트 소식</div></div><div style="padding:0 18px" id="notesBody"></div>' +
        '<div style="padding:0 18px"><button class="btn bp" style="margin-top:14px" data-x>확인</button></div></div>';
      (document.getElementById('app')||document.body).appendChild(s);
      Array.prototype.forEach.call(s.querySelectorAll('[data-x]'), function (b) { b.onclick = function () { s.classList.remove('on'); }; });
    }
    document.getElementById('notesBody').innerHTML = NOTES.map(function (n) {
      return '<div class="sec" style="margin-top:6px">' + esc(n.v) + ' <span class="t3">· ' + esc(n.d) + '</span></div>' +
        '<div class="t2" style="line-height:1.8">' + n.items.map(function (i) { return '· ' + esc(i); }).join('<br>') + '</div>';
    }).join('');
    s.classList.add('on');
    try { localStorage.setItem('tt-notes-seen', VER); } catch (e) {}
  }
  window.ttOpenNotes = open;
  window.addEventListener('load', function () {
    var pc = document.querySelector('.plus-card');
    if (pc && !document.getElementById('notesCard')) {
      var b = document.createElement('button'); b.className = 'card'; b.id = 'notesCard'; b.onclick = open;
      b.style.cssText = 'display:block;box-sizing:border-box;width:calc(100% - 28px);text-align:left;border:0;font:inherit';
      b.innerHTML = '<div class="row"><div class="t1" style="font-size:14px">업데이트 소식</div><div class="sp"></div><span class="chip y">' + VER + '</span></div>';
      pc.parentNode.insertBefore(b, pc);
    }
    var seen = null; try { seen = localStorage.getItem('tt-notes-seen'); } catch (e) {}
    if (seen !== VER) setTimeout(function () { if (!document.querySelector('.sheet.on')) open(); }, 2500);
  });
})();

// 노크방 목록: 노크 시간 옆에 마지막 접속(앱을 연) 시간
window.__ttSeenLine = function (m, isMe) {
  if (isMe || !m || !m.last_seen_at) return '';
  var h = (Date.now() - Date.parse(m.last_seen_at)) / 36e5;
  if (!(h >= 0)) return '';
  return ' · 접속 ' + (h < 1 ? '방금 전' : Math.floor(h) + '시간 전');
};

// 그림첩: 열린 그림을 휴대폰에 저장 (공유 시트 → '이미지 저장', 안 되면 내려받기)
(function () {
  function toast(t) { var e = document.getElementById('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  // 아이폰은 누르는 즉시 공유 창을 열어야 해서, 그림이 열릴 때 파일을 미리 만들어 둠
  var ready = null;
  async function build(img) {
    var im = new Image(); im.src = img.src; await im.decode();
    var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    c.getContext('2d').drawImage(im, 0, 0);
    var blob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.92); });
    var t = (document.getElementById('picViewTitle') || {}).textContent || '그림';
    return new File([blob], '톡톡_' + t.replace(/[^\w가-힣]+/g, '_') + '.jpg', { type: 'image/jpeg' });
  }
  function iosApp() { var u = navigator.userAgent; return (/iP(hone|ad|od)/.test(u) || (navigator.maxTouchPoints > 1 && /Mac/.test(u))) && navigator.standalone; }
  function download(f) {
    if (iosApp()) { toast('그림을 길게 눌러 \'사진에 추가\'를 눌러 주세요'); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('그림을 저장했어요');
  }
  function fail() { toast('저장하지 못했어요 · 그림을 길게 눌러 저장해 보세요'); }
  function save() {
    var img = document.querySelector('#picView img'); if (!img || img.classList.contains('pv-blur')) return;
    var f = ready && ready.src === img.src ? ready.file : null;
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
      navigator.share({ files: [f] }).catch(function (e) { if (!e || e.name !== 'AbortError') download(f); });
      return;
    }
    (f ? Promise.resolve(f) : build(img)).then(download).catch(fail);
  }
  function sync() {
    var pan = document.querySelector('#picSheet .pan'); if (!pan) return;
    var b = document.getElementById('ttSavePic');
    if (!b) {
      b = document.createElement('button'); b.id = 'ttSavePic'; b.className = 'btn bp'; b.style.marginTop = '14px';
      b.textContent = '휴대폰에 저장하기'; b.onclick = save;
      var buy = document.getElementById('picBuy'); buy ? buy.parentNode.insertBefore(b, buy.nextSibling) : pan.appendChild(b);
    }
    var img = document.querySelector('#picView img');
    var ok = img && !img.classList.contains('pv-blur');
    b.style.display = ok ? '' : 'none';
    if (ok && !(ready && ready.src === img.src)) { var s = img.src; build(img).then(function (f) { ready = { src: s, file: f }; }).catch(function () {}); }
  }
  window.addEventListener('load', function () {
    var at = window.albumTap;
    if (typeof at === 'function') window.albumTap = function () { var x = at.apply(this, arguments); sync(); return x; };
  });
})();
