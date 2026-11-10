// 또옥또옥 '내 기록 모두 지우기(탈퇴)'
// 로그인한 본인만 자기 계정을 지울 수 있어요.
// - 내가 방장인 노크방: 다른 사람이 있으면 가장 먼저 들어온 사람에게 방장을 넘기고, 혼자면 방을 없애요.
// - 이름·전화번호·알림 주소·컨디션·기프티콘 번호 등 나를 알아볼 수 있는 정보는 모두 지워요.
// - 함께 채운 그림이 줄어들지 않도록, 노크 기록은 누구인지 알 수 없는 무작위 값으로 바꿔 남겨요.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function must<T>(p: PromiseLike<{ data: T; error: unknown }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(what + ": " + ((error as { message?: string }).message || String(error)));
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action !== "delete_me" || body.confirm !== "지워 주세요") return json({ error: "확인 문구가 없어요" }, 400);
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u, error } = await db.auth.getUser(jwt);
    if (error || !u?.user) return json({ error: "로그인이 필요해요" }, 401);
    const uid = u.user.id;

    // 1) 내가 방장인 방 정리
    const owned = await must(db.from("rooms").select("id").eq("created_by", uid), "rooms");
    let moved = 0, removed = 0;
    for (const r of owned || []) {
      const next = await must(
        db.from("members").select("user_id").eq("room_id", r.id).neq("user_id", uid).order("joined_at").limit(1),
        "next owner",
      );
      if (next && next.length) {
        await must(db.from("rooms").update({ created_by: next[0].user_id }).eq("id", r.id), "move owner");
        moved++;
      } else {
        await must(db.from("rooms").delete().eq("id", r.id), "delete room");
        removed++;
      }
    }

    // 2) 노크 기록은 알아볼 수 없게 바꿔서 남겨요 (함께 채운 그림 유지)
    const anon = crypto.randomUUID();
    await must(db.from("knocks").update({ user_id: anon, mood: null, mood_at: null }).eq("user_id", uid), "knocks");
    await must(db.from("extra_knocks").update({ user_id: anon }).eq("user_id", uid), "extra knocks");
    await must(db.from("golden_wins").update({ user_id: anon, contact: null, contact_at: null }).eq("user_id", uid), "golden");

    // 3) 나를 알아볼 수 있는 정보는 지워요
    await must(db.from("members").delete().eq("user_id", uid), "members");
    await must(db.from("nudges").delete().or(`from_user.eq.${uid},to_user.eq.${uid}`), "nudges");
    await must(db.from("invites").delete().eq("from_user", uid), "invites");
    await must(db.from("room_bans").delete().eq("user_id", uid), "bans");
    await must(db.from("push_subs").delete().eq("user_id", uid), "push subs");
    await must(db.from("push_log").delete().eq("user_id", uid), "push log");
    await must(db.from("profiles").delete().eq("user_id", uid), "profile");

    // 4) 계정 자체를 지워요
    const { error: delErr } = await db.auth.admin.deleteUser(uid);
    if (delErr) throw new Error("account: " + delErr.message);

    return json({ ok: true, moved_owner: moved, removed_rooms: removed });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
