#!/usr/bin/env bash
# 사용: tools/release.sh "커밋 설명"  → 커밋, 푸시(충돌 시 자동 재시도), GitHub Pages 배포 완료까지 기다려요.
set -e
cd "$(dirname "$0")/.."
git add -A
git commit -qm "$1

Co-Authored-By: Claude <noreply@anthropic.com>" || { echo "바뀐 것이 없어요"; exit 0; }
for i in 1 2 3; do git push -q origin main && break; git fetch -q origin && git rebase -q origin/main; done
git log --oneline -1
for i in $(seq 1 18); do
  s=$(gh run list -L1 --json status,conclusion,name -q '.[0].name+" "+.[0].status+" "+.[0].conclusion' 2>/dev/null || true)
  case "$s" in *completed*) echo "배포: $s"; exit 0;; esac; sleep 10
done
echo "배포 확인 시간 초과 (나중에 gh run list로 확인)"
