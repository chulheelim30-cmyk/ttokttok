// 풍년이만 움직여요: 그림 전체가 아니라 눈 깜빡임과 숨쉬기 (그림첩 g01~g12)
(function () {
  var CFG = {"1":{"e":[[61,37,2.7,"#c9c7c7"],[73.3,45.5,2.7,"#bcb9b8"]],"b":[35,60,35,30]},"2":{"e":[[26.7,70.8,3.1,"#c1bfbe"],[40.8,74.5,3.1,"#c9c6c5"]],"b":[55,45,30,25]},"3":{"e":[[48.3,30,2.3,"#dddcd7"],[57.7,26.3,2.3,"#d5c9c3"]],"b":[52,65,18,25]},"4":{"e":[[48.8,46.3,2.3,"#d2cfca"]],"b":[62,65,28,20]},"5":{"e":[[44.4,37,2.9,"#ede3d5"],[54.2,47,2.9,"#c4c0bc"]],"b":[50,80,25,20]},"6":{"e":[],"b":[46,52,30,18]},"7":{"e":[[28.1,42.5,8.3,"#c9c7c1"],[71.9,42.5,8.3,"#ccc9c3"]],"b":null},"8":{"e":[[42.3,43.8,2.1,"#cfcec7"],[27.5,53.3,2.1,"#b3b2ac"]],"b":[66,55,30,25]},"9":{"e":[[28.5,41.3,1.9,"#c7c6c0"],[39,40,1.9,"#cfcdc9"]],"b":[29,60,20,20]},"10":{"e":[[44.2,26.8,1.1,"#a9aaa2"],[48.8,26.1,1.1,"#a9aaa2"]],"b":[46,50,10,28]},"11":{"e":[[45.8,32.5,1.3,"#babcb4"],[53.1,32.5,1.3,"#d2d3ce"]],"b":[49,60,10,28]},"12":{"e":[[31.9,51,1.7,"#dad8d4"],[28.5,60,1.7,"#b8b9b4"]],"b":[50,50,32,22]}};
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var css = document.createElement('style');
  css.textContent =
    '.tt-anim{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
    '.tt-anim img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}' +
    '.tt-breath{animation:ttBreath 5s cubic-bezier(.45,0,.55,1) infinite alternate}' +
    '.tt-lid{position:absolute;border-radius:50%;transform:scaleY(0);animation:ttBlink 5s infinite}' +
    '@keyframes ttBreath{from{transform:none}to{transform:scale(1.004,1.011)}}' +
    '@keyframes ttBlink{0%,90%{transform:scaleY(0)}93%,95%{transform:scaleY(1)}98%,100%{transform:scaleY(0)}}';
  document.head.appendChild(css);
  function num(src) { var m = /\/art\/g(\d\d)\.webp/.exec(src || ''); return m ? +m[1] : 0; }
  function add(img) {
    var n = num(img.getAttribute('src')), c = CFG[n]; if (!c) return;
    img.setAttribute('data-anim', n);
    var box = document.createElement('div'); box.className = 'tt-anim'; box.setAttribute('aria-hidden', 'true');
    var b = c.b;
    if (b) {
      var m = 'radial-gradient(' + b[2] + '% ' + b[3] + '% at ' + b[0] + '% ' + b[1] + '%, #000 35%, transparent 100%)';
      var cp = document.createElement('img'); cp.src = img.src; cp.alt = ''; cp.className = 'tt-breath';
      cp.style.webkitMaskImage = m; cp.style.maskImage = m;
      cp.style.transformOrigin = b[0] + '% ' + Math.min(100, b[1] + b[3]) + '%';
      if (n === 6) cp.style.animationDuration = '6.5s';
      box.appendChild(cp);
    }
    var delay = (Math.random() * 3).toFixed(2) + 's';
    if (window.__ttBlink) c.e.forEach(function (e) { // 눈 깜빡임은 어색해서 꺼 둠 (자연스러운 영상으로 바꿀 예정)
      var w = e[2] * 2 * 1.45, h = e[2] * 2 * 1.15 * 1.2, l = document.createElement('i');
      l.className = 'tt-lid';
      l.style.cssText += 'left:' + (e[0] - w / 2) + '%;top:' + (e[1] - h / 2) + '%;width:' + w + '%;height:' + h + '%;' +
        'background:radial-gradient(closest-side,' + e[3] + ' 70%,' + e[3] + '00 100%);animation-delay:' + delay;
      box.appendChild(l);
    });
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
