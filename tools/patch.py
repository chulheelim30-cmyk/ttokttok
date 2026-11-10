#!/usr/bin/env python3
"""또옥또옥 수정 도구 — 번들(app-*.js)이나 파일의 문자열을 바꾸고, 해시·참조·캐시 버전을 자동으로 맞춰요.

사용: python3 tools/patch.py edits.json
edits.json = [{"file": "bundle" | "index.html" | "mood.js" ..., "old": "...", "new": "...", "count": 1}, ...]
 - "bundle"은 index.html이 지금 쓰는 app-*.js
 - count: old가 몇 번 나와야 하는지(기본 1). 다르면 아무것도 안 바꾸고 멈춰요.
 - 바뀐 보조 스크립트(mood.js 등)는 index.html·sw.js의 ?v= 숫자를 자동으로 올려요.
 - sw.js 캐시 이름(ttokttok-YYYYMMDDHHMM)은 항상 새로 바꿔요.
"""
import hashlib, json, os, re, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda f: os.path.join(ROOT, f)
rd = lambda f: open(P(f), encoding="utf-8").read()
def wr(f, s): open(P(f), "w", encoding="utf-8").write(s)

edits = json.load(open(sys.argv[1], encoding="utf-8"))
index = rd("index.html")
sw = rd("sw.js")
bundle = re.search(r"app-[a-z0-9]+\.js", index).group(0)
files = {}
def get(f):
    if f == "index.html": return index
    if f == "sw.js": return sw
    return files.setdefault(f, rd(f))
for e in edits:
    f = bundle if e["file"] == "bundle" else e["file"]
    cur = get(f); n = cur.count(e["old"]); want = e.get("count", 1)
    if n != want:
        sys.exit(f"멈춤: {f}에서 찾는 글이 {n}번 나와요 (기대 {want}번): {e['old'][:60]!r}")
    cur = cur.replace(e["old"], e["new"])
    if f == "index.html": index = cur
    elif f == "sw.js": sw = cur
    else: files[f] = cur
for f, s2 in files.items():
    if f == bundle:
        new = "app-%s.js" % hashlib.md5(s2.encode()).hexdigest()[:8]
        wr(new, s2); index = index.replace(bundle, new); sw = sw.replace(bundle, new)
        print("번들:", bundle, "→", new)
    else:
        wr(f, s2)
        m = re.search(re.escape(f) + r"\?v=(\d+)", index)
        if m:
            v = int(m.group(1)) + 1
            index = index.replace(f"{f}?v={m.group(1)}", f"{f}?v={v}"); sw = sw.replace(f"{f}?v={m.group(1)}", f"{f}?v={v}")
            print(f"{f}: ?v={v}")
        else:
            print(f"{f}: 저장 (index.html에 ?v= 참조 없음)")
wr("index.html", index)
sw = re.sub(r"ttokttok-\d+", "ttokttok-" + time.strftime("%Y%m%d%H%M", time.gmtime(time.time() + 9 * 3600)), sw)
wr("sw.js", sw)
print("완료 · 시험: tools/test/run.sh <시험.py> · 배포: tools/release.sh \"설명\"")
