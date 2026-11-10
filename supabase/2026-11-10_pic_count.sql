-- 그림 진행은 rooms.pic_count(노크·추가 노크가 들어올 때만 +1, 줄지 않음)로 셉니다.
-- 예전엔 knocks 줄 수를 셌는데, 나가기·내보내기·계정 이어하기에서 노크가 지워지면 그림이 뒤로 갔어요.
alter table public.rooms add column if not exists pic_count int not null default 0;
-- _golden_after_knock: n := count(...) → update rooms set pic_count = pic_count + 1 ... returning pic_count into n
-- room_pic_count(p_room uuid) returns int  (구성원만, authenticated)
