-- 계정 이어하기: 앱을 새로 깔거나 다른 폰·브라우저로 옮겨도 예전 계정(노크방·이름·기록)을 그대로 이어 써요.
-- 예전 기기에서 ‘이어하기 코드’를 만들고, 새 기기에서 그 코드를 넣으면 예전 계정의 기록이 새 계정으로 옮겨져요.

create table if not exists public.account_transfers (
  code_hash text primary key,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
alter table public.account_transfers enable row level security;

-- 코드 만들기 (예전 기기) : 만들 때마다 이전 코드는 없어져요
create or replace function public.create_transfer_code() returns text
language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare
  abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v text := '';
  i int;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  for i in 1..10 loop
    v := v || substr(abc, 1 + floor(random() * length(abc))::int, 1);
  end loop;
  delete from public.account_transfers where user_id = auth.uid() or expires_at < now();
  insert into public.account_transfers(code_hash, user_id)
    values (encode(digest(v, 'sha256'), 'hex'), auth.uid());
  return substr(v, 1, 4) || '-' || substr(v, 5, 3) || '-' || substr(v, 8, 3);
end $$;

-- 코드 넣기 (새 기기) : 예전 계정의 기록을 지금 계정으로 옮겨요
create or replace function public.claim_transfer_code(p_code text) returns json
language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare
  v_old uuid;
  v_new uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_rooms int;
begin
  if v_new is null then raise exception '로그인이 필요해요'; end if;
  select user_id into v_old from public.account_transfers
    where code_hash = encode(digest(v_code, 'sha256'), 'hex') and expires_at > now();
  if v_old is null then raise exception '코드가 맞지 않거나 기간이 지났어요'; end if;
  if v_old = v_new then raise exception '이미 이 계정이에요'; end if;

  -- 새 계정이 예전 계정과 같은 노크방에 따로 들어가 있었다면, 새 계정 쪽 중복 기록은 지워요
  delete from public.knocks       where user_id = v_new and room_id in (select room_id from public.members where user_id = v_old);
  delete from public.extra_knocks where user_id = v_new and room_id in (select room_id from public.members where user_id = v_old);
  delete from public.member_real_names where user_id = v_new and room_id in (select room_id from public.members where user_id = v_old);
  delete from public.tt_shown_names where user_id = v_new::text and room_id in (select room_id::text from public.members where user_id = v_old);
  delete from public.nudges where (from_user = v_new or to_user = v_new) and room_id in (select room_id from public.members where user_id = v_old);
  delete from public.members where user_id = v_new and room_id in (select room_id from public.members where user_id = v_old);
  -- 새 계정이 혼자 만든 방이 있다면 그대로 두고, 방장만 옮겨 받아요
  delete from public.profiles where user_id = v_new;

  update public.members           set user_id = v_new where user_id = v_old;
  update public.knocks            set user_id = v_new where user_id = v_old;
  update public.extra_knocks      set user_id = v_new where user_id = v_old;
  update public.golden_wins       set user_id = v_new where user_id = v_old;
  update public.member_real_names set user_id = v_new where user_id = v_old;
  update public.tt_shown_names    set user_id = v_new::text where user_id = v_old::text;
  update public.nudges            set from_user = v_new where from_user = v_old;
  update public.nudges            set to_user = v_new where to_user = v_old;
  update public.invites           set from_user = v_new where from_user = v_old;
  update public.room_bans         set user_id = v_new where user_id = v_old;
  update public.rooms             set created_by = v_new where created_by = v_old;
  update public.profiles          set user_id = v_new where user_id = v_old;
  update public.push_subs         set user_id = v_new where user_id = v_old;
  update public.push_log          set user_id = v_new where user_id = v_old;
  update public.operators         set user_id = v_new where user_id = v_old;
  if to_regclass('public.room_admins') is not null then
    execute 'delete from public.room_admins where user_id = $1 and room_id in (select room_id from public.room_admins where user_id = $2)' using v_new, v_old;
    execute 'update public.room_admins set user_id = $1 where user_id = $2' using v_new, v_old;
  end if;

  delete from public.account_transfers where user_id = v_old;
  select count(*) into v_rooms from public.members where user_id = v_new;
  -- 새 기기 화면을 바로 예전 방으로 열 수 있게 방·이름 정보를 함께 돌려줘요
  return json_build_object('ok', true, 'rooms', v_rooms,
    'room',    (select to_jsonb(r) from public.rooms r join public.members m on m.room_id = r.id where m.user_id = v_new limit 1),
    'member',  (select to_jsonb(m) from public.members m where m.user_id = v_new limit 1),
    'profile', (select to_jsonb(p) from public.profiles p where p.user_id = v_new limit 1));
end $$;

grant execute on function public.create_transfer_code(), public.claim_transfer_code(text) to authenticated;
