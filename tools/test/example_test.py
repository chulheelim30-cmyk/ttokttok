# 예시: 노크 화면이 오류 없이 뜨는지
from harness import *
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg, errs = page_for(b, "U0")
    pg.wait_for_timeout(1500)
    pg.screenshot(path="shot.png")
    print("errors:", errs)
