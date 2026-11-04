// 또옥또옥: 뒤로가기
// 1) 열린 창(시트)이 있으면 닫기  2) 다른 탭이면 노크(메인) 화면으로
// 3) 메인에서는 "한 번 더 누르면 종료" 안내 → 2초 안에 다시 누르면 종료
(function () {
  if (!window.history || !history.pushState) return;
  var lastBack = 0, exiting = false;

  function guard() { try { history.pushState({ tt: 'guard' }, ''); } catch (e) {} }

  function openSheets() { return document.querySelectorAll('.sheet.on'); }
  function openFulls() {
    return Array.prototype.filter.call(document.querySelectorAll('.full.on'), function (el) {
      return el.id !== 'f-onb'; // 첫 화면(이름 입력)은 뒤로가기로 닫지 않아요
    });
  }
  function onMain() {
    var v = document.getElementById('v-knock');
    return !v || !v.classList.contains('hide');
  }

  window.addEventListener('popstate', function () {
    if (exiting) return;
    var sheets = openSheets(), fulls = openFulls();
    if (sheets.length || fulls.length) {
      sheets.forEach(function (s) { s.classList.remove('on'); });
      fulls.forEach(function (f) { f.classList.remove('on'); });
      guard();
      return;
    }
    if (!onMain()) {
      if (window.go) window.go('knock');
      guard();
      return;
    }
    var now = Date.now();
    if (now - lastBack < 2000) {
      exiting = true;
      history.back(); // 맨 처음 기록으로 나가면 앱이 닫혀요
      return;
    }
    lastBack = now;
    if (window.toast) window.toast('한 번 더 누르면 앱이 종료돼요');
    guard();
  });

  // 안드로이드 크롬·삼성 인터넷은 '화면을 건드리기 전에 만든 기록'을 뒤로가기 때 건너뛰어요.
  // 그래서 첫 터치(사용자 동작) 때 보호 기록을 만들어요.
  var armed = false;
  function arm() {
    if (armed) return;
    armed = true;
    try { if (!history.state || history.state.tt !== 'guard') { history.replaceState({ tt: 'root' }, ''); guard(); } } catch (e) {}
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (t) { window.removeEventListener(t, arm, true); });
  }
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (t) { window.addEventListener(t, arm, true); });
})();
