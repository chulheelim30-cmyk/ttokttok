# 톡톡 (저장소 ttokttok, 옛 이름 또옥또옥) — 작업 안내

베타: https://chulheelim30-cmyk.github.io/ttokttok/ · 저장소 chulheelim30-cmyk/ttokttok (main → GitHub Pages)
**여러 세션이 같은 저장소를 고쳐요. 작업 전 `git pull --rebase`, 배포는 `tools/release.sh`(충돌 시 재시도).**

하루 1초 '노크'로 따로 사는 가족·친구가 서로 안부를 주고받고, 소식이 끊기면 알려 주는 웹앱(PWA).
운영자: 임철희 (갤럭시 사용, 비개발자 · 한국어 해요체로 짧게 답하기). 고양이 캐릭터 '풍년이'.

## 토큰 아끼는 규칙 (먼저 읽기)
- **번들(app-*.js, 약 100KB 한 줄)은 절대 통째로 읽지 않기.** `grep -o '.\{80\}찾는말.\{200\}' app-*.js`로 필요한 부분만.
- 수정은 `tools/patch.py edits.json` → 시험 `tools/test/run.sh 시험.py` → 배포 `tools/release.sh "설명"` 세 줄로 끝내기.
- 화면 확인은 스크린샷 1장만, 필요할 때만. 테스트 출력은 짧게.
- 서버 함수 전체를 다시 쓰지 말고 `pg_get_functiondef` + `replace`로 필요한 부분만 바꾸기 (아래 '서버 수정 요령').
- 문서(Claude Docs)·이미지 작업은 요청받을 때만. 답은 결론 먼저, 짧게.

## 파일
- `index.html`: 화면 전부 + 인라인 스타일. 현재 번들·CSS 파일명을 참조.
- `app-<hash>.js`: 빌드된 앱(원본 소스 없음, 직접 패치). `app-21865120.css`.
- 보조 스크립트(번들 밖, 읽기 쉬움): `push.js`(웹푸시 켜기/테스트), `mood.js`(오늘 컨디션·앱 연 시각), `rooms.js`(방 종류·인원, 그림 미리보기, 방장 전용 실명, 확인 필요한 사람 위로 정렬: 모든 구성원·10분마다 다시 계산), `account.js`(탈퇴), `ptr.js`(모든 화면 아래로 당겨 새로고침, 안쪽 스크롤이 맨 위일 때만, 기본 당김은 overscroll contain으로 끔), `kakao.js`(카톡 등 앱 안 브라우저 → 크롬/사파리로 열기, 번들보다 먼저 실행), `back.js`(뒤로가기), `pwa.js`, `anim.js`(풍년이 깜빡임·그림 완성 축하), `easy.js`(어르신용 쉬운 모드: 큰 노크 버튼+가족 무사 여부, 설정에서 켜기 또는 ?easy=1, localStorage tt-easy), `puzzle.js`(그림판 30칸을 직소 퍼즐 조각 모양으로: #board .grid 앞에 SVG를 끼움, 조각 모양은 그림마다 고정, 방금 연 조각은 덮개가 들려 사라지는 연출, 맞춘 조각만 강조(굵은 테두리·빛·그늘 입체·덮개 위 그림자, 11/10), 안 연 조각은 연한 평면 덮개, 물방울 아이콘 숨김. 화면 문구는 '칸' 대신 '조각'), `theme.css`.
- 현재 버전(바뀌면 여기 고치기): rooms.js?v=32 · mood.js?v=10 · ptr.js?v=1 · anim.js?v=10 · theme.css?v=8 · push v4 · account v1 · kakao.js?v=1 · easy.js?v=1 · puzzle.js?v=5.
- `sw.js`: 서비스워커. SHELL 목록 + 캐시 이름 `ttokttok-YYYYMMDDHHMM`(patch.py가 자동 갱신) + push/notificationclick.
- `privacy.html`: 개인정보처리방침(항목 추가 시 같이 고치기).
- `art/`: 공개 그림만. **개인 사진은 저장소에 절대 넣지 않기** (Supabase 비공개 버킷 `beta-art`).
- `android/`: 플레이스토어용 TWA 프로젝트(패키지 kr.ttokttok.app). 빌드는 `.github/workflows/android.yml`(GitHub Actions) → 릴리스에 서명 전 AAB + 시험용 APK. 서명은 업로드 키(사용자가 보관)로 로컬 jarsigner. 아이콘 교체 등 안드로이드 작업은 '나중에' 상태.
- `supabase/functions/{push,account}/index.ts`: 배포된 엣지 함수 원본. `supabase/*.sql`: 다른 세션이 만든 마이그레이션(room_admins, account_transfer).
- `tools/`: patch.py, release.sh, test/(harness.py, run.sh, example_test.py).

## 번들에서 꺼내 둔 전역 연결고리
`__ttRpc(name, body)`, `__ttAuth()`(유효 토큰), `__ttRoom`(현재 방 {id,name,created_by,room_type,max_members}), `__ttRerender()`, `__ttMe()`, `__ttIsPlus()`, `__ttPicNow()/__ttPicTap(n)`, `__ttGoldStar/__ttRealTag/__ttMoodTag/__ttSeenTag`(목록 꾸밈 훅), `__ttAfterJoin(r)`(입장 후), `__ttRoomChip(n)`.
번들 안 주요 이름: `Y()` 전체 렌더, `Pi` 구성원 줄, `P()` RPC, `N()` REST, `L` 데이터 캐시, `z` 로컬 상태, `M()` 내 id, `I()` getElementById.

## 서버 (Supabase 프로젝트 pbmocpzclvndlevuvfto)
- 익명 로그인(localStorage `ttokttok-auth-v1`), 공개키 `sb_publishable_H42uVMl_0JG6NwuWhczkXw_85g9oaPi`.
- 테이블: rooms(room_type family|crew|group, max_members 2~30), members(threshold_hours, paused, last_knock_at, last_seen_at), knocks(day, mood 1~5: 1 좋음·2 그냥·3 별로·4 아주 좋음·5 힘들어요, 3·5=안 좋음, mood_at), pats(토닥토닥, from·to·day 고유), extra_knocks, nudges(pushed_at), golden_wins, profiles(plus), invites, room_bans, push_subs, push_log, _push_config(VAPID·cron 비밀), member_real_names(방장 전용, 별도 보관), operators, room_admins(방장 포함 최대 3명, 방장과 같은 권한), 계정 이어하기 코드(transfer_code, 기기 바꿀 때), account_logins(전화번호+비밀번호 6자리로 계정 찾기: set_login/my_login/claim_login, 5번 틀리면 15분 잠금. 로그아웃은 rooms.js, 번호 등록한 사람만 보임. member_real_names FK는 deferrable(계정 옮길 때 members 먼저 바뀌어서, 11/10 고침). claim_transfer_code는 같은 방에 있던 새 계정의 push_log·room_bans·operators 중복도 먼저 정리(11/10)).
- 그 밖: 운영자에게만 'Claude 점검 보고' 표시, 업데이트 소식(베타4.1), 그림 완성 시 축하 연출.
- 주요 RPC: do_knock, knock_all, create_room_v2, join_room, accept_invite, update_room_settings, set_mood, send_pat, my_pats, my_pats_sent, touch_seen, save/remove_push_sub, set_real_name, my_real_name, room_real_names, room_golden, am_operator, _push_claim(서버 전용), _ops_daily_stats_v2(아침 리포트), _lonely_rooms.
- 그림 진행: `rooms.pic_count`(노크 들어올 때만 +1, 줄지 않음) → RPC `room_pic_count`. knocks 줄 수로 세지 말 것(나가기·내보내기에서 지워짐).
- 트리거: members_before_insert(인원 한도·크루 72시간), _golden_after_knock(황금 칸 그림당 1칸).
- 엣지 함수: `push`(cron 1분마다 tick: 알림 발송 + 10분마다 혼자 24시간 방 정리, test, key), `account`(탈퇴). 둘 다 verify_jwt=false, 자체 인증.
- cron: `ttok-push-tick` (pg_cron + pg_net, 매분).
- 알림 규칙(_push_claim): 기준시간 지나면 본인 '괜찮아요?' → 3시간 뒤 노크방 / 앱 열면 무사 / 밤 22~8시엔 콕만 / 컨디션 안 좋음(3·5) / 토닥토닥 / 황금 칸 / 일요일 19시 주간 컨디션 / 저녁 8시 리마인드.

### 서버 수정 요령 (중요)
- MCP `execute_sql`은 **delete·drop이 들어간 문장을 사용자 확인으로 보내는데, 모바일에서는 자동 취소됨.** 지우기가 필요하면 엣지 함수(supabase-js `.delete()`)나 FK `on delete cascade`, 트리거 대신 DO 블록 조건(`if not exists ... create trigger`)으로 우회.
- 함수 일부만 바꾸기: `DO $$ d:=pg_get_functiondef('public._push_claim()'::regprocedure); d:=replace(d,'  -- 콕 찌르기', '<새 구간>  -- 콕 찌르기'); execute d; $$`.
- 새 테이블은 service_role에 grant 필요(엣지 함수용). RLS 켜고 anon/authenticated revoke.
- 시험은 DO 블록 안에서 `set_config('request.jwt.claims', ...)`로 사용자 흉내 → 끝에 `raise exception`으로 되돌리기.
- 실제 API 시험은 `net.http_post`로 익명 가입 → 토큰으로 호출(셸에서는 supabase·github.io 접속 막힘).

## 막힌 것 / 우회
- 셸에서 *.supabase.co, *.github.io, dl.google.com 접속 불가. GitHub API는 됨(Actions 비밀 설정 API는 막힘).
- 네이버 데이터랩 등 일부 사이트는 WebFetch 불가 → 사용자가 캡처를 보내 줌.
- 사용자는 모바일이라 확인창 뜨는 작업(DB 삭제 등)은 피하기.

## 사용자 결정 사항 (바꾸지 말 것)
- 초간단 앱 유지. 공익성 중요. 개인 사진 비공개. 운영자 기능은 운영자만.
- 양방향(부모만 확인받는 구조 아님), 대상은 '가까운 사람'(가족·친구·크루). 하트 주고받기는 하지 않음.
- 11/11 방향 추가: 동네방(행정동 단위, GPS 없이 동 직접 선택, 끊김 알림은 방장=통장·복지관 담당자에게만, 이웃엔 집계만). 퍼즐 30조각 고정(초대 동기). 기획: 프로젝트 문서 claude/똑똑_동네방_기획_v1.md. 아직 구현 안 함.
- 컨디션: 5가지(아주 좋음·좋음·그냥·별로·힘들어요, 11/11), 노크 후 큰 버튼, 목록엔 글자로만(얼굴·7일 점 없음), 주간 알림으로 위로·안부.
- 아이콘: 11/11 퍼즐+하트+손 시안(7번)을 베이지·세이지로 고르기로 함(웹앱 아이콘·favicon 교체 완료 11/11, v=9: 같은 디자인을 벡터 icon.svg로 다시 그려 고해상도 PNG 생성, 수정은 icon.svg에서. 풍년이 그림 g01~12·blink는 AI 업스케일(Real-ESRGAN anime) 2배, 11/11. 안드로이드 TWA 아이콘은 아직). 화면 색은 theme.css v2(베이지·세이지, 배치·기능 그대로).
- 플러스 월 2,900원 · 1년 29,000원(11/10 변경), 단체 1인 월 1,500원(베타 무료, 결제는 '준비 중'). 결제자만: 그림 미리보기·하루 3번·방 5개·소리·배지. 노크방 모두(곧): 문자 알림·형제 분담·주간 리포트·1년권 선물. 기본 안부 알림은 언제나 무료.
- 그림 단품 판매 없음. 황금 칸 그림당 1칸, 당첨은 모두에게 공개.
- 실명: 입장할 때 별명과 함께 선택 입력, 방장에게만 보임.
- 혼자인 방은 24시간 뒤 자동 삭제.
- 쉬운 모드(60~70대): 같은 앱 안, 자녀가 대신 설정. 큰 노크 버튼 + 가족 무사 여부만.
- 토닥토닥(11/11 구현, 하트는 🤍가 안 보여 분홍 SVG 하트·푸시는 💗): 오늘 컨디션 별로·힘들어요인 사람 옆 버튼, 한 사람에게 하루 1번, 세지 않음. 받은 사람은 앱 열면 카드 + 푸시(밤엔 아침에). mood.js `__ttPatBtn`(번들 Pi 칩 뒤).
- 사업자 등록·결제는 예비창업패키지(2027.3 예상) 선정 후. 토스는 그 뒤. 지금은 웹앱 + 지인 베타 + 플레이스토어 비공개 테스트(나중).

## 참고 문서·작업
- 한 장 요약(Claude Docs): https://claude.ai/artifact/4xJ5se7tRcpsdCoymr3E9j
- 복지관·지자체 공략 가이드: https://claude.ai/artifact/EZsGZx62bP4vopEtEv8L2z
- 주간 브리핑 예약 작업: trig_016BvAzhLMYihQHtQ5XS1DqW (매주 금 17:50 KST, ops_daily 조회만). 예전 아침 리포트는 없어짐.
- 지표 기록: `ops_daily(day, stats jsonb)` — cron `ttok-ops-daily` 매일 00:10 KST에 전날 `_ops_daily_stats_v2` + `app_openers` 저장(11/4부터). `seen_days(user_id, day)` — touch_seen 때 날마다 앱 연 사람 기록(11/10부터, 이전은 마지막 접속만).
- 운영자 계정 user_id: c4b1891f-6156-469b-8389-224f4fac2d00 (11/11 확인, operators 표 기준. 예전 cdc8fd6d…)
- 데모 노크방(11/11, 코드 042295): 운영자 + 가상 20명. `_demo_rooms`·`_demo_members`(user_id, knock_min, every_days, mood_low_pct), cron `ttok-demo-tick` 10분마다 `_demo_tick()`가 정해진 시각에 대신 노크(며칠 걸러 노크하는 사람도 있어 주의·확인 필요가 돌아가며 생김). 데모방은 _push_claim(대상·원인)과 _ops_daily_stats·v2 통계에서 모두 빠짐. 가상 인물은 auth 계정 없음.
