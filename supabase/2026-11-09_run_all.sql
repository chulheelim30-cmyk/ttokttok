-- 한 번에 실행: ① 관리자(방장 포함 3명) ② 계정 이어하기
-- 노크방 관리자: 처음 만든 사람(방장)이 구성원 중 최대 2명을 관리자로(방장 포함 총 3명) 정해요.
-- 관리자는 앱에서 방장과 같은 일을 해요(방 이름·설정 바꾸기, 실명 보기, 내보내기, 노크방 없애기).
-- 단, 관리자 지정·해제는 방장만, 방장은 아무도 내보낼 수 없어요.

create table if not exists public.room_admins (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.room_admins enable row level security;

create or replace function public.is_room_manager(p_room uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.rooms where id = p_room and created_by = auth.uid())
      or exists (select 1 from public.room_admins a
                 join public.members m on m.room_id = a.room_id and m.user_id = a.user_id
                 where a.room_id = p_room and a.user_id = auth.uid())
$$;

create or replace function public.room_admin_list(p_room uuid) returns table(user_id uuid)
language sql stable security definer set search_path to 'public' as $$
  select a.user_id from public.room_admins a
  join public.members m on m.room_id = a.room_id and m.user_id = a.user_id
  where a.room_id = p_room and public.is_member(p_room)
$$;

create or replace function public.set_room_admin(p_room uuid, p_user uuid, p_on boolean) returns json
language plpgsql security definer set search_path to 'public' as $$
declare v_cnt int;
begin
  if not exists (select 1 from public.rooms where id = p_room and created_by = auth.uid()) then
    raise exception '방장만 관리자를 정할 수 있어요'; end if;
  if p_user = auth.uid() then raise exception '방장은 이미 모든 권한이 있어요'; end if;
  if not exists (select 1 from public.members where room_id = p_room and user_id = p_user) then
    raise exception '이 노크방의 구성원이 아니에요'; end if;
  if p_on then
    select count(*) into v_cnt from public.room_admins a
      join public.members m on m.room_id = a.room_id and m.user_id = a.user_id
      where a.room_id = p_room and a.user_id <> p_user;
    if v_cnt >= 2 then raise exception '방장 포함 3명까지 정할 수 있어요'; end if;
    insert into public.room_admins(room_id, user_id) values (p_room, p_user) on conflict do nothing;
  else
    delete from public.room_admins where room_id = p_room and user_id = p_user;
  end if;
  return json_build_object('ok', true, 'admin', p_on);
end $$;

create or replace function public.rename_room(p_room uuid, p_name text) returns json
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_room_manager(p_room) then raise exception '방장이나 관리자만 바꿀 수 있어요'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception '방 이름을 적어 주세요'; end if;
  update public.rooms set name = left(trim(p_name), 14) where id = p_room;
  return json_build_object('ok', true);
end $$;

create or replace function public.update_room_settings(p_room uuid, p_room_type text, p_max_members integer) returns json
language plpgsql security definer set search_path to 'public' as $$
declare v_cnt int; v_max int;
begin
  if not public.is_room_manager(p_room) then raise exception '방장이나 관리자만 바꿀 수 있어요'; end if;
  if p_room_type not in ('family','crew','group') then raise exception '방 종류가 올바르지 않아요'; end if;
  v_max := greatest(2, least(30, coalesce(p_max_members, 30)));
  select count(*) into v_cnt from public.members where room_id = p_room;
  if v_max < v_cnt then raise exception '지금 %명이 있어서 %명보다 적게 줄일 수 없어요', v_cnt, v_cnt; end if;
  update public.rooms set room_type = p_room_type, max_members = v_max where id = p_room;
  return json_build_object('ok', true, 'room_type', p_room_type, 'max_members', v_max);
end $$;

create or replace function public.room_real_names(p_room uuid) returns table(user_id uuid, real_name text)
language sql stable security definer set search_path to 'public' as $$
  select r.user_id, r.real_name from public.member_real_names r
  where r.room_id = p_room and r.real_name is not null and public.is_room_manager(p_room)
$$;

create or replace function public.kick_member(p_room uuid, p_user uuid) returns json
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_room_manager(p_room) then raise exception '방장이나 관리자만 내보낼 수 있어요'; end if;
  if p_user = auth.uid() then raise exception '자신은 내보낼 수 없어요 · 나가기를 써 주세요'; end if;
  if exists (select 1 from public.rooms where id = p_room and created_by = p_user) then
    raise exception '방장은 내보낼 수 없어요'; end if;
  delete from public.members where room_id = p_room and user_id = p_user;
  delete from public.knocks where room_id = p_room and user_id = p_user;
  delete from public.nudges where room_id = p_room and (from_user = p_user or to_user = p_user);
  delete from public.invites where room_id = p_room and phone_hash = (select phone_hash from public.profiles where user_id = p_user);
  delete from public.room_admins where room_id = p_room and user_id = p_user;
  insert into public.room_bans (room_id, user_id) values (p_room, p_user) on conflict do nothing;
  return json_build_object('ok', true);
end $$;

create or replace function public.delete_room(p_room uuid) returns json
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_room_manager(p_room) then raise exception '방장이나 관리자만 노크방을 없앨 수 있어요'; end if;
  delete from public.rooms where id = p_room; -- 구성원·노크·두드리기·초대·관리자 기록도 함께 지워져요
  return json_build_object('ok', true);
end $$;

create or replace function public.leave_room(p_room uuid) returns json
language plpgsql security definer set search_path to 'public' as $$
declare v_next uuid;
begin
  if not public.is_member(p_room) then raise exception '이 노크방의 구성원이 아니에요'; end if;
  if exists (select 1 from public.rooms where id = p_room and created_by = auth.uid()) then
    -- 방장이 나가면 관리자 중 가장 먼저 들어온 사람, 없으면 가장 먼저 들어온 구성원이 방장이 돼요
    select m.user_id into v_next from public.members m
      left join public.room_admins a on a.room_id = m.room_id and a.user_id = m.user_id
      where m.room_id = p_room and m.user_id <> auth.uid()
      order by (a.user_id is not null) desc, m.joined_at limit 1;
    if v_next is null then
      delete from public.rooms where id = p_room;
      return json_build_object('ok', true, 'deleted', true);
    end if;
    update public.rooms set created_by = v_next where id = p_room;
    delete from public.room_admins where room_id = p_room and user_id = v_next;
  end if;
  delete from public.members where room_id = p_room and user_id = auth.uid();
  delete from public.knocks where room_id = p_room and user_id = auth.uid();
  delete from public.nudges where room_id = p_room and (from_user = auth.uid() or to_user = auth.uid());
  delete from public.room_admins where room_id = p_room and user_id = auth.uid();
  return json_build_object('ok', true, 'deleted', false);
end $$;

grant execute on function public.is_room_manager(uuid), public.room_admin_list(uuid),
  public.set_room_admin(uuid, uuid, boolean) to authenticated;

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
