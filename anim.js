// 풍년이만 움직여요: 눈 감은 그림으로 자연스럽게 깜빡이고, 몸은 살짝 숨쉬어요 (그림첩 g01~g12)
(function () {
  var BODY = {"1":[35,60,35,30],"2":[55,45,30,25],"3":[52,65,18,25],"4":[62,65,28,20],"5":[50,80,25,20],"6":[46,52,30,18],"8":[66,55,30,25],"9":[29,60,20,20],"10":[46,50,10,28],"11":[49,60,10,28],"12":[50,50,32,22]};
  // AI 영상(Wan 2.2, 상업적 사용 가능)이 준비된 그림 번호: art/anim/gNN.mp4 를 넣고 여기에 번호를 적으면 그 그림은 영상으로 움직여요
  var VIDEOS = [];
  var EYES = {"1":[55.667,30.0,24.0,22.8],"2":[21.5,63.4,25.0,18.4],"3":[43.833,22.4,17.333,13.2],"4":[43.667,40.0,10.167,12.0],"5":[39.167,30.2,20.333,23.8],"7":[11.167,22.2,77.333,40.8],"8":[21.5,36.4,27.0,24.8],"9":[24.333,34.8,20.0,12.0],"10":[41.667,22.4,10.0,8.0],"11":[43.667,28.8,12.667,7.4],"12":[23.333,46.8,12.333,18.2]}; // 눈 부분 위치 (그림 대비 %): 왼쪽, 위, 너비, 높이
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var css = document.createElement('style');
  css.textContent =
    '.tt-anim{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
    '.tt-anim>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}' +
    '.tt-breath{animation:ttBreath 5s cubic-bezier(.45,0,.55,1) infinite alternate}' +
    '.tt-eyes{position:absolute}' +
    '.tt-eyes img{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 28ms linear}' +
    '@keyframes ttBreath{from{transform:none}to{transform:scale(1.004,1.011)}}';
  document.head.appendChild(css);
  function num(src) { var m = /\/art\/g(\d\d)\.webp/.exec(src || ''); return m ? +m[1] : 0; }
  // 눈꺼풀이 내려왔다(빠르게) 올라가요(조금 천천히): 뜬 눈 → 1/3 → 2/3 → 감음 → 2/3 → 1/3 → 뜬 눈
  function blinkLoop(box, fr) {
    function show(k) { for (var j = 0; j < fr.length; j++) fr[j].style.opacity = j === k ? 1 : 0; }
    function step() {
      if (!box.isConnected) return;
      var slow = Math.random() < 0.18, hold = slow ? 420 : 90, t = 0;
      [[0, 0], [1, 35], [2, 35]].forEach(function (a) { t += a[1]; setTimeout(function () { show(a[0]); }, t); });
      t += hold;
      [[1, 0], [0, slow ? 90 : 55], [-1, slow ? 90 : 55]].forEach(function (a) { t += a[1]; setTimeout(function () { show(a[0]); }, t); });
      var next = 3000 + Math.random() * 3000;
      if (!slow && Math.random() < 0.2) next = t + 260; // 가끔 두 번 연달아
      setTimeout(step, next);
    }
    setTimeout(step, 800 + Math.random() * 2500);
  }
  function add(img) {
    var n = num(img.getAttribute('src')), b = BODY[n], e = EYES[n];
    if (!b && !e) return;
    img.setAttribute('data-anim', n);
    if (VIDEOS.indexOf(n) >= 0) {
      var vb = document.createElement('div'); vb.className = 'tt-anim'; vb.setAttribute('aria-hidden', 'true');
      var v = document.createElement('video'); v.src = './art/anim/g' + (n < 10 ? '0' : '') + n + '.mp4?v=1';
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('playsinline', '');
      v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s';
      v.oncanplay = function () { v.style.opacity = 1; v.play().catch(function () {}); };
      vb.appendChild(v); img.parentNode.insertBefore(vb, img.nextSibling); return;
    }
    var box = document.createElement('div'); box.className = 'tt-anim'; box.setAttribute('aria-hidden', 'true');
    var dur = n === 6 ? '6.5s' : '5s', ox, oy;
    if (b) {
      var m = 'radial-gradient(' + b[2] + '% ' + b[3] + '% at ' + b[0] + '% ' + b[1] + '%, #000 35%, transparent 100%)';
      var cp = document.createElement('img'); cp.src = img.src; cp.alt = ''; cp.className = 'tt-breath';
      cp.style.webkitMaskImage = m; cp.style.maskImage = m;
      ox = b[0]; oy = Math.min(100, b[1] + b[3]);
      cp.style.transformOrigin = ox + '% ' + oy + '%'; cp.style.animationDuration = dur;
      box.appendChild(cp);
    }
    if (e) {
      var w = document.createElement('div'); w.className = 'tt-eyes';
      w.style.cssText = 'left:' + e[0] + '%;top:' + e[1] + '%;width:' + e[2] + '%;height:' + e[3] + '%';
      if (b) { // 몸과 같이 숨쉬도록 같은 움직임
        w.className += ' tt-breath'; w.style.animationDuration = dur;
        w.style.transformOrigin = ((ox - e[0]) / e[2] * 100) + '% ' + ((oy - e[1]) / e[3] * 100) + '%';
      }
      var p = './art/blink/g' + (n < 10 ? '0' : '') + n, fr = ['q', 'half', 'closed'].map(function (k) {
        var x = new Image(); x.src = p + '-' + k + '.webp?v=3'; x.alt = ''; w.appendChild(x); return x;
      });
      box.appendChild(w);
      blinkLoop(box, fr);
    }
    img.parentNode.insertBefore(box, img.nextSibling);
  }
  function scan() {
    var list = document.querySelectorAll('img[src*="/art/g"]:not([data-anim])');
    for (var i = 0; i < list.length; i++) {
      var img = list[i];
      if (img.closest('.th.blur') || img.closest('.tt-anim') || img.classList.contains('pv-blur')) continue;
      add(img);
    }
  }
  var t = null;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 60); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', scan);
})();
