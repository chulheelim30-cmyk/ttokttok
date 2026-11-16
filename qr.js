// QR 코드로 초대: 노크방 초대 링크(?join=코드)를 QR로 크게 보여 줘요. 다른 사람이 카메라로 찍으면 바로 이 방에 들어와요.
(function () {
  function code() {
    var r = window.__ttRoom;
    if (r && r.code) return String(r.code);
    var el = document.getElementById('inviteCode');
    var c = el ? el.textContent.replace(/\s/g, '') : '';
    return /^\d{6}$/.test(c) ? c : '';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (m) { return '&#' + m.charCodeAt(0) + ';'; }); }
  window.showInviteQR = function () {
    var c = code();
    if (!c) { alert('노크방을 먼저 만들어 주세요'); return; }
    var url = 'https://chulheelim30-cmyk.github.io/ttokttok/?join=' + c;
    var q = qrcode(0, 'M'); q.addData(url); q.make();
    var svg = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    var name = (window.__ttRoom && window.__ttRoom.name) || '우리 노크방';
    var o = document.createElement('div');
    o.id = 'ttQr';
    o.setAttribute('style', 'position:fixed;inset:0;z-index:9999;background:rgba(30,28,24,.55);display:flex;align-items:center;justify-content:center;padding:20px');
    o.innerHTML = '<div style="background:#fffdf8;border-radius:22px;padding:22px 20px 18px;width:100%;max-width:340px;text-align:center">' +
      '<div style="font-weight:800;font-size:18px">‘' + esc(name) + '’ 초대 QR</div>' +
      '<div style="font-size:14px;opacity:.75;margin-top:4px">휴대폰 카메라로 찍으면 바로 이 노크방에 들어와요</div>' +
      '<div style="width:260px;height:260px;margin:16px auto 8px;background:#fff">' + svg + '</div>' +
      '<div style="font-size:15px;letter-spacing:2px">초대 코드 ' + c.slice(0, 3) + ' ' + c.slice(3) + '</div>' +
      '<button class="btn bp" style="margin-top:14px">닫기</button></div>';
    o.addEventListener('click', function (e) { if (e.target === o || e.target.tagName === 'BUTTON') o.remove(); });
    document.body.appendChild(o);
  };
})();
