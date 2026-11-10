#!/usr/bin/env bash
# 사용: tools/test/run.sh path/to/test.py
# 저장소를 임시 폴더로 복사해 띄우고, 가짜 Supabase로 화면 시험을 돌려요.
set -e
TEST="$(realpath "$1")"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${SCRATCH:-/tmp/ttok-test}"; mkdir -p "$WORK"
rm -rf "$WORK/site" && mkdir -p "$WORK/site"
(cd "$ROOT" && tar --exclude=.git --exclude=android --exclude=tools --exclude=supabase -cf - .) | (cd "$WORK/site" && tar -xf -)
cd "$WORK" && SITE="$WORK/site" PYTHONPATH="$ROOT/tools/test" timeout 120 python3 "$TEST" 2>&1 | grep -v '"GET /'
