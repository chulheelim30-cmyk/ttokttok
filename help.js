// 도움이 필요할 때: 한국사회보장정보원 복지서비스 API에서 받아 둔 목록(welfare.json)으로 나이대·지역에 맞는 제도와 문의처를 보여 줘요.
// 인증키는 앱에 없어요. 목록 갱신은 welfare.json을 새로 받아 바꾸면 돼요. ?help=1 로 바로 열려요.
(function () {
  var W = null, KEY = 'tt-help';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (m) { return '&#' + m.charCodeAt(0) + ';'; }); }
  function tel(p) { return /^[\d-]+$/.test(p) ? '<a href="tel:' + p + '" style="font-weight:800;color:#2f6b4f;text-decoration:none">☎ ' + p + '</a>' : '<span style="opacity:.8">' + esc(p) + '</span>'; }
  function pref() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function draw(o) {
    var p = pref(), age = p.age || '중장년', sido = p.sido || '';
    var sidos = W.l.map(function (x) { return x[1]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort();
    var sel = function (id, list, cur, all) { return '<select id="' + id + '" style="flex:1;padding:10px;border-radius:10px;border:1px solid #d8d2c4;font-size:15px;background:#fff">' + (all ? '<option value="">' + all + '</option>' : '') + list.map(function (x) { return '<option' + (x === cur ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>'; };
    var loc = W.l.filter(function (x) { return x[1] === sido && (!x[3] || x[3].indexOf(age) >= 0); });
    var cen = W.c.filter(function (x) { return x[3].indexOf(age) >= 0; });
    var item = function (t, sub, extra) { return '<div style="padding:12px 0;border-top:1px solid #eee6d8"><div style="font-weight:700;font-size:15px">' + esc(t) + '</div><div style="font-size:13px;opacity:.75;margin-top:2px">' + sub + '</div>' + (extra || '') + '</div>'; };
    o.firstChild.innerHTML =
      '<div style="font-weight:800;font-size:18px">도움이 필요할 때</div>' +
      '<div style="font-size:13px;opacity:.75;margin-top:4px">나이대와 사는 곳에 맞는 제도와 전화할 곳이에요</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px">' + sel('hAge', ['청년', '중장년', '노년'], age) + sel('hSido', sidos, sido, '사는 곳(시·도)') + '</div>' +
      '<div style="overflow:auto;flex:1;margin-top:10px">' +
      (sido ? '<div style="font-size:13px;font-weight:800;margin-top:6px;color:#2f6b4f">우리 지역 (' + esc(sido) + ') ' + loc.length + '개</div>' + (loc.length ? loc.map(function (x) { return item(x[0], esc(x[1] + ' ' + x[2]) + ' · 문의: 시·군·구청, 행정복지센터'); }).join('') : '<div style="font-size:13px;opacity:.7;padding:8px 0">받아 둔 목록에는 아직 없어요. 아래 전국 제도를 확인해 보세요.</div>') : '') +
      '<div style="font-size:13px;font-weight:800;margin-top:12px;color:#2f6b4f">전국 제도 ' + cen.length + '개</div>' +
      cen.map(function (x) { return item(x[0], esc(x[4]), '<div style="margin-top:4px;font-size:14px">' + tel(x[2]) + ' <span style="font-size:12px;opacity:.6">' + esc(x[1]) + '</span></div>'); }).join('') +
      '</div>' +
      '<div style="font-size:12px;opacity:.65;margin-top:10px;line-height:1.5">출처: ' + esc(W.src) + ' (' + W.asof + ' 기준) · 잘 모르겠으면 보건복지상담센터 <a href="tel:129">129</a> · 위급하면 <a href="tel:119">119</a></div>' +
      '<button class="btn bp" style="margin-top:10px" data-x>닫기</button>';
    o.querySelector('#hAge').onchange = function (e) { var q = pref(); q.age = e.target.value; save(q); draw(o); };
    o.querySelector('#hSido').onchange = function (e) { var q = pref(); q.sido = e.target.value; save(q); draw(o); };
  }
  window.showHelp = function () {
    var o = document.createElement('div');
    o.id = 'ttHelp';
    o.setAttribute('style', 'position:fixed;inset:0;z-index:9999;background:rgba(30,28,24,.55);display:flex;align-items:center;justify-content:center;padding:16px');
    o.innerHTML = '<div style="background:#fffdf8;border-radius:22px;padding:20px 18px 16px;width:100%;max-width:420px;max-height:88vh;display:flex;flex-direction:column">불러오는 중…</div>';
    o.addEventListener('click', function (e) { if (e.target === o || (e.target.hasAttribute && e.target.hasAttribute('data-x'))) o.remove(); });
    document.body.appendChild(o);
    (W ? Promise.resolve(W) : fetch('./welfare.json?v=1').then(function (r) { return r.json(); })).then(function (j) { W = j; draw(o); })
      .catch(function () { o.firstChild.innerHTML = '목록을 불러오지 못했어요. 보건복지상담센터 <a href="tel:129">129</a>로 전화해 주세요. <button class="btn bp" style="margin-top:10px" data-x>닫기</button>'; });
  };
  if (/[?&]help=1/.test(location.search)) window.addEventListener('load', function () { setTimeout(window.showHelp, 600); });
})();
