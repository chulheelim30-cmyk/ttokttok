# 또옥또옥 화면 시험용 가짜 서버 (Supabase 응답을 흉내 내요)
# 사용: tools/test/run.sh 내시험.py  → 내시험.py 안에서 from harness import *
import json, os, re, threading, http.server, functools, time
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8765), functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.environ.get("SITE","site")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
ROOM = "room-abc"
state = {"count": 0}
members = [{"user_id": f"U{i}", "name": f"사람{i}", "color": "#f90", "sound": "drop", "threshold_hours": 48, "paused": False, "last_knock_at": None, "joined_at": "2026-11-01"} for i in range(30)]

def handler(route):
    u = urlparse(route.request.url); p = u.path; q = parse_qs(u.query)
    J = lambda o, st=200, h=None: route.fulfill(status=st, content_type="application/json", body=json.dumps(o), headers={"access-control-allow-origin":"*","access-control-expose-headers":"Content-Range",**(h or {})})
    if "/auth/v1/" in p: return J({"access_token": "AT", "refresh_token": "RT", "expires_in": 3600, "user": {"id": "U0"}})
    if p.endswith("rpc/knock_all"): state["count"] += 1; return J(None)
    if p.endswith("rpc/my_invites"): return J([])
    if p.endswith("/members") and "user_id" in q and "room_id" not in q: return J([{"joined_at": "x", "rooms": {"id": ROOM, "code": "802464", "name": "베타테스트v0.1", "created_by": "U0"}}])
    if p.endswith("/members"): return J(members)
    if p.endswith("/knocks") and "limit" in q: return J([], h={"content-range": f"0-0/{state['count']}"})
    if p.endswith("/knocks"): return J([])
    if p.endswith("/nudges"): return J([])
    return J([])

def page_for(browser, uid):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
    ctx.route(re.compile(r".*supabase\.co.*"), handler)
    ctx.add_init_script(f"""localStorage.setItem('ttokttok-auth-v1', JSON.stringify({{access_token:'AT',refresh_token:'RT',expires_at:Math.floor(Date.now()/1e3)+3000,user_id:'{uid}'}}));
      if(!localStorage.getItem('ttokttok-proto-v1'))localStorage.setItem('ttokttok-proto-v1', JSON.stringify({{started:true,name:'{uid}',roomId:'{ROOM}',roomName:'베타',roomCode:'802464'}}));""")
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://127.0.0.1:8765/index.html"); pg.wait_for_timeout(1500)
    return pg, errs

def show(pg, tag):
    st = pg.evaluate("JSON.parse(localStorage.getItem('ttokttok-proto-v1'))")
    print(f"{tag:26} 칸={pg.inner_text('#picCount'):6} 그림첩={len(st['album'])}장 열린칸={sorted(st['opened'])[:6]}... 서버노크수={state['count']}")
    return st

