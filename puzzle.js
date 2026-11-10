/* 퍼즐 그림판: 30조각(6x5)을 직소 퍼즐 조각 모양으로 보여 줘요.
   번들의 J()가 #board 안에 그림 + .grid(30조각)를 그리면, 그 사이에 퍼즐 SVG를 끼워 넣어요.
   - 안 연 조각: 연한 평면 덮개 (눈에 안 띄게)
   - 맞춘 조각만 강조: 굵은 테두리 + 빛·그늘 입체 + 덮개 위로 그림자 (실제 퍼즐처럼)
   - 방금 연 조각(.flash): 덮개 조각이 들려 올라가며 사라지는 연출
   조각 모양은 그림 번호(month)마다 고정이라 날마다 같은 퍼즐이에요. */
(function () {
  var COLS = 6, ROWS = 5, S = 100, W = COLS * S, H = ROWS * S;
  var TAB = [[[.30,0],[.42,.02],[.38,.12]],[[.34,.22],[.42,.30],[.50,.30]],[[.58,.30],[.66,.22],[.62,.12]],[[.58,.02],[.70,0],[1,0]]];
  var cache = {};

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function edge(x0, y0, x1, y1, nx, ny, sign, r) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    if (!sign) return [[[x0 + dx / 3, y0 + dy / 3], [x0 + 2 * dx / 3, y0 + 2 * dy / 3], [x1, y1]]];
    var j = (r() - .5) * .08, amp = .92 + r() * .16;
    return TAB.map(function (seg) {
      return seg.map(function (p) {
        var t = p[0] > 0 && p[0] < 1 ? p[0] + j : p[0], h = p[1] * L * amp * sign * .85;
        return [x0 + dx * t + nx * h, y0 + dy * t + ny * h];
      });
    });
  }
  function rev(segs, start) {
    var pts = [start].concat(segs.map(function (s) { return s[2]; })), out = [];
    for (var i = segs.length - 1; i >= 0; i--) out.push([segs[i][1], segs[i][0], pts[i]]);
    return out;
  }
  function f(n) { return Math.round(n * 10) / 10; }

  function pieces(no) {
    if (cache[no]) return cache[no];
    var r = rng(9173 + no * 131), hs = {}, vs = {}, out = [], row, col;
    for (row = 1; row < ROWS; row++) for (col = 0; col < COLS; col++)
      hs[row + ',' + col] = edge(col * S, row * S, (col + 1) * S, row * S, 0, 1, r() < .5 ? 1 : -1, r);
    for (row = 0; row < ROWS; row++) for (col = 1; col < COLS; col++)
      vs[row + ',' + col] = edge(col * S, row * S, col * S, (row + 1) * S, 1, 0, r() < .5 ? 1 : -1, r);
    for (row = 0; row < ROWS; row++) for (col = 0; col < COLS; col++) {
      var x0 = col * S, y0 = row * S, x1 = x0 + S, y1 = y0 + S;
      var top = hs[row + ',' + col] || edge(x0, y0, x1, y0, 0, 1, 0);
      var right = vs[row + ',' + (col + 1)] || edge(x1, y0, x1, y1, 1, 0, 0);
      var bot = hs[(row + 1) + ',' + col] ? rev(hs[(row + 1) + ',' + col], [x0, y1]) : edge(x1, y1, x0, y1, 0, 1, 0);
      var left = vs[row + ',' + col] ? rev(vs[row + ',' + col], [x0, y0]) : edge(x0, y1, x0, y0, 1, 0, 0);
      var d = 'M' + x0 + ',' + y0;
      [top, right, bot, left].forEach(function (segs) {
        segs.forEach(function (s) { d += 'C' + f(s[0][0]) + ',' + f(s[0][1]) + ' ' + f(s[1][0]) + ',' + f(s[1][1]) + ' ' + f(s[2][0]) + ',' + f(s[2][1]); });
      });
      out.push(d + 'Z');
    }
    return (cache[no] = out);
  }

  var css = document.createElement('style');
  css.textContent =
    '#board>svg.pz{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
    '#board .grid .c{background:transparent!important}' +
    '#board .grid div{border:0!important}' +
    '#board .grid .c svg{display:none!important}' +
    '#board .grid .open.gold{box-shadow:none!important}' +
    '.pz .cv path{fill:#F1E8DA;stroke:#D8C9B1;stroke-width:.8}' +
    '.pz .sh path{fill:#000;filter:url(#pzS)}' +
    '.pz .op path{fill:#000;stroke:none;filter:url(#pzO)}' +
    '.pz .ln path{fill:none;stroke:rgba(18,28,58,.62);stroke-width:3.4;stroke-linejoin:round}' +
    '.pz .hl path{fill:none;stroke:rgba(255,255,255,.55);stroke-width:1.1;transform:translate(1.4px,1.4px)}' +
    '.pz .gd{fill:none;stroke:#ffd34d;stroke-width:3.2;filter:drop-shadow(0 0 3px rgba(255,200,40,.8))}' +
    '.pz .nw{fill:#EBE0CF;stroke:#C7B697;stroke-width:1;transform-box:fill-box;transform-origin:50% 50%;animation:pzin 1.1s ease-in forwards}' +
    '@keyframes pzin{0%{opacity:1;transform:none}35%{opacity:1;transform:translateY(-6px) scale(1.08)}100%{opacity:0;transform:translateY(-14px) scale(1.18)}}';
  document.head.appendChild(css);

  // 입체 효과: 조각 안쪽 가장자리에 빛(왼쪽 위)과 그늘(오른쪽 아래)
  function bevel(id, depth, keep) {
    return '<filter id="' + id + '" x="-5%" y="-5%" width="110%" height="115%">' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="' + depth + '" result="b"/>' +
      '<feOffset in="b" dx="' + depth + '" dy="' + depth + '" result="ol"/>' +
      '<feComposite in="SourceAlpha" in2="ol" operator="out" result="lt"/>' +
      '<feFlood flood-color="#fff" flood-opacity="' + (keep ? .85 : .55) + '"/><feComposite in2="lt" operator="in" result="hi"/>' +
      '<feOffset in="b" dx="-' + depth + '" dy="-' + depth + '" result="od"/>' +
      '<feComposite in="SourceAlpha" in2="od" operator="out" result="dk"/>' +
      '<feFlood flood-color="#5A4632" flood-opacity="' + (keep ? .32 : .38) + '"/><feComposite in2="dk" operator="in" result="lo"/>' +
      (keep ? '<feGaussianBlur in="SourceAlpha" stdDeviation="2.2"/><feOffset dy="3" result="ds"/>' +
        '<feFlood flood-color="#5A4632" flood-opacity=".28"/><feComposite in2="ds" operator="in" result="sd"/>' +
        '<feMerge><feMergeNode in="sd"/><feMergeNode in="SourceGraphic"/><feMergeNode in="lo"/><feMergeNode in="hi"/></feMerge>'
        : '<feMerge><feMergeNode in="lo"/><feMergeNode in="hi"/></feMerge>') +
      '</filter>';
  }
  var DEFS = '<defs><linearGradient id="pzG" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#F7F1E7"/><stop offset="1" stop-color="#E0D2BC"/></linearGradient>' +
    bevel('pzO', 4.5, false) +
    // 맞춘 조각이 덮개 위로 살짝 떠 보이게: 조각 바깥으로만 그림자
    '<filter id="pzS" x="-10%" y="-10%" width="130%" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/>' +
    '<feOffset dx="2" dy="4" result="o"/><feComposite in="o" in2="SourceAlpha" operator="out" result="s"/>' +
    '<feFlood flood-color="#5A4632" flood-opacity=".45"/><feComposite in2="s" operator="in"/></filter></defs>';

  var last = '';
  function draw() {
    var board = document.getElementById('board'); if (!board) return;
    var grid = board.querySelector(':scope>.grid'); if (!grid) return;
    var cells = grid.children; if (cells.length !== 30) return;
    var no = 0; try { no = (typeof z !== 'undefined' && z.month) || 0; } catch (e) {}
    var pic = board.querySelector(':scope>img,:scope>video'); if (pic) no = pic.getAttribute('src') || no;
    var key = String(no), sig = '';
    for (var i = 0; i < 30; i++) sig += cells[i].className + '|';
    var old = board.querySelector(':scope>svg.pz');
    if (old && old.nextElementSibling === grid && last === key + sig) return;
    last = key + sig;
    var seed = 0; key.split('').forEach(function (ch) { seed = (seed * 31 + ch.charCodeAt(0)) | 0; });
    var P = pieces(Math.abs(seed) % 997), cv = '', op = '', gd = '', nw = '';
    for (i = 0; i < 30; i++) {
      var c = cells[i].classList;
      if (c.contains('open')) {
        op += '<path d="' + P[i] + '"/>';
        if (c.contains('gold')) gd += '<path class="gd" d="' + P[i] + '"/>';
        if (c.contains('flash')) nw += '<path class="nw" d="' + P[i] + '"/>';
      } else cv += '<path d="' + P[i] + '"/>';
    }
    var done = cv === '';
    var svg = '<svg class="pz' + (done ? ' done' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + DEFS +
      '<g class="cv">' + cv + '</g><g class="sh">' + op + '</g><g class="op">' + op + '</g><g class="hl">' + op + '</g><g class="ln">' + op + '</g>' + nw + gd + '</svg>';
    if (old) old.remove();
    grid.insertAdjacentHTML('beforebegin', svg);
  }

  function start() {
    var board = document.getElementById('board');
    if (!board) return setTimeout(start, 300);
    new MutationObserver(function () { draw(); }).observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    draw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
