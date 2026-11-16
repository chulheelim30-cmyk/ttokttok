// 또옥또옥 휴대폰 알림 보내기
// - action "tick": 1분마다 서버(cron)가 불러요. 보낼 알림을 골라 보내요.
// - action "test": 앱에서 '테스트 알림'을 누르면 내 폰으로만 하나 보내요.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

let cfg: Record<string, string> | null = null;
async function config() {
  if (cfg) return cfg;
  const { data, error } = await db.from("_push_config").select("k,v");
  if (error) throw error;
  cfg = Object.fromEntries((data || []).map((r: { k: string; v: string }) => [r.k, r.v]));
  webpush.setVapidDetails(cfg.subject, cfg.vapid_public, cfg.vapid_private);
  return cfg;
}

type Msg = { user_id: string; title: string; body: string; tag: string; url: string };

// 영어 사용자(user_lang.lang='en')에게는 알림 문구를 영어로 바꿔요. 긴 문구부터 바꿔요. (11/16)
const EN: [string, string][] = ([
  ["★ 우리 그림 완성 + 황금 칸 당첨!", "★ Painting complete + golden piece won!"],
  ["🎉 우리 그림의 모든 칸이 열렸어요", "🎉 Every piece of our painting is open"],
  ["🧩 마지막 한 조각만 남았어요!", "🧩 Just one piece left!"],
  ["1초면 돼요. 오늘의 안부를 또옥 두드려 주세요.", "It takes one second. Tap today's knock."],
  ["내 노크로 마지막 칸을 열어 그림이 완성됐어요. 앱에서 기프티콘을 받아 주세요.", "Your knock finished the painting! Claim your gift card in the app."],
  ["노크는 했어요. 토닥토닥 💗 해 주거나 전화 한 통 어때요?", "They knocked. How about a pat 💗 or a quick call?"],
  ["누구든 한 번만 더 노크하면 우리 그림이 완성돼요. 가족에게 콕 찔러 볼까요?", "One more knock from anyone finishes our painting. Nudge your family?"],
  ["님이 마지막 황금 칸을 열었어요. 완성된 그림을 확인해 보세요!", " opened the last golden piece. Come see the finished painting!"],
  ["님이 콕 찔렀어요. 오늘 안부를 또옥 두드려 주세요.", " nudged you. Tap today's knock."],
  ["님이 토닥토닥 해 줬어요. 오늘은 조금 쉬어 가요.", " sent you a pat 💗 Take it easy today."],
  ["님 오늘 컨디션이 안 좋대요", " isn't feeling great today"],
  ["님 이번 주 컨디션", "'s week"],
  ["님 소식이 없어요", " hasn't checked in"],
  ["시간 동안 노크가 없었어요. 괜찮다면 한 번만 두드려 주세요. 3시간 뒤에도 소식이 없으면 노크방에 알려요.", " hours without a knock. If you're okay, just tap once. If we don't hear from you in 3 hours, we'll let your room know."],
  ["시간째 노크도, 앱 확인도 없어요. 전화나 메시지로 안부를 확인해 보세요.", " hours with no knock and no app visit. Try a call or message to check in."],
  ["일 있었어요. 토닥토닥, 잘 버텼어요. 다음 주는 조금 더 가볍길.", ". Pat pat, you made it through. Hope next week is lighter."],
  ["일 있었어요. 주말에 안부 전화 한 통 어때요?", ". How about a call this weekend?"],
  ["일. 다음 주도 하루 1초 안부 함께해요.", ". One second a day again next week."],
  ["일이었어요. 다음 주도 또옥!", ". Keep knocking next week!"],
  ["컨디션이 안 좋은 날이 ", "Hard days: "],
  ["‘좋음’인 날이 ", "Good days: "],
  ["일 · 안 좋은 날 ", " · hard days "],
  ["일 · 그냥 ", " · okay "],
  ["좋은 날 ", "Good days "],
  ["지금 노크하면 내 손으로 우리 그림을 완성할 수 있어요.", "Knock now to finish our painting yourself."],
  ["이번 주 컨디션 좋았네요!", "Great week!"],
  ["이번 주 힘든 날이 많았죠", "A lot of hard days this week"],
  ["이번 주도 수고했어요", "Well done this week"],
  ["오늘 또옥 했어요?", "Did you knock today?"],
  ["토닥토닥 💗", "Pat pat 💗"],
  ["괜찮아요?", "Are you okay?"],
  ["가까운 사람", "Someone close"],
  ["콕!", "Nudge!"],
  ["알림이 잘 와요. 이제 가까운 사람의 노크가 멈추면 이렇게 알려 드려요.", "Notifications work! If someone close stops knocking, we'll let you know like this."],
  ["또옥!", "Knock!"],
] as [string, string][]).sort((a, b) => b[0].length - a[0].length);
const toEn = (s: string) => EN.reduce((t, [k, e]) => t.split(k).join(e), s || "");

async function sendTo(msgs: Msg[]) {
  if (!msgs.length) return { sent: 0, gone: 0, failed: 0, ok: [] as boolean[], lost: [] as boolean[] };
  const ids = [...new Set(msgs.map((m) => m.user_id))];
  const { data: langs } = await db.from("user_lang").select("user_id").in("user_id", ids).eq("lang", "en");
  const en = new Set((langs || []).map((x: { user_id: string }) => x.user_id));
  if (en.size) msgs = msgs.map((m) => en.has(m.user_id) ? { ...m, title: toEn(m.title), body: toEn(m.body) } : m);
  const { data: subs, error } = await db.from("push_subs").select("endpoint,user_id,p256dh,auth").in("user_id", ids);
  if (error) throw error;
  let sent = 0, gone = 0, failed = 0;
  const ok = msgs.map(() => false), lost = msgs.map(() => false);
  const jobs: Promise<void>[] = [];
  msgs.forEach((m, i) => {
    for (const s of (subs || []).filter((x) => x.user_id === m.user_id)) {
      jobs.push(
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: m.title, body: m.body, tag: m.tag, url: m.url }),
            { TTL: 60 * 60 * 12, urgency: "high" },
          )
          .then(async () => {
            sent++;
            ok[i] = true;
            await db.from("push_subs").update({ last_ok_at: new Date().toISOString() }).eq("endpoint", s.endpoint);
          })
          .catch(async (e: { statusCode?: number; body?: string }) => {
            if (e && (e.statusCode === 404 || e.statusCode === 410)) {
              gone++;
              lost[i] = true;
              await db.from("push_subs").delete().eq("endpoint", s.endpoint);
            } else {
              failed++;
              console.error("push fail", e && e.statusCode, e && e.body);
            }
          }),
      );
    }
  });
  await Promise.all(jobs);
  return { sent, gone, failed, ok, lost };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const c = await config();
    const body = await req.json().catch(() => ({}));
    if (body.action === "tick") {
      if (req.headers.get("x-cron-secret") !== c.cron_secret) return json({ error: "forbidden" }, 403);
      const { data, error } = await db.rpc("_push_claim");
      if (error) throw error;
      // 등록이 만료돼(gone) 못 보낸 알림은 push_retry에 두었다가, 새로 등록되면 6시간 안에 다시 보내요 (11/16)
      const claimed = (data || []) as Msg[];
      const since = new Date(Date.now() - 6 * 3600e3).toISOString();
      const { data: rq } = await db.from("push_retry").select("id,user_id,title,body,tag,url").gt("created_at", since).limit(50);
      const retry = (rq || []) as (Msg & { id: number })[];
      const r = await sendTo([...claimed, ...retry.map(({ id: _id, ...m }) => m)]);
      const lostNew = claimed.filter((_, i) => r.lost[i] && !r.ok[i]);
      if (lostNew.length) {
        const { error: qErr } = await db.from("push_retry").insert(lostNew.map(({ user_id, title, body, tag, url }) => ({ user_id, title, body, tag, url })));
        if (qErr) console.error("retry queue", qErr.message);
      }
      const done = retry.filter((_, j) => r.ok[claimed.length + j]).map((x) => x.id);
      if (done.length) await db.from("push_retry").delete().in("id", done);
      // 10분마다: 혼자인 채로 24시간 지난 노크방 정리 (구성원·노크 기록은 함께 지워져요)
      let cleaned = 0;
      if (new Date().getUTCMinutes() % 10 === 0) {
        await db.from("push_retry").delete().lt("created_at", since);
        const { data: lonely } = await db.rpc("_lonely_rooms");
        const ids = (lonely || []).map((x: { id: string }) => x.id);
        if (ids.length) {
          const { error: delErr } = await db.from("rooms").delete().in("id", ids);
          if (delErr) console.error("lonely cleanup", delErr.message); else cleaned = ids.length;
        }
      }
      return json({ ok: true, picked: claimed.length, retried: done.length, queued: lostNew.length, cleaned, sent: r.sent, gone: r.gone, failed: r.failed });
    }
    if (body.action === "test") {
      const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: u, error } = await db.auth.getUser(jwt);
      if (error || !u?.user) return json({ error: "로그인이 필요해요" }, 401);
      const r = await sendTo([{
        user_id: u.user.id,
        title: "또옥!",
        body: "알림이 잘 와요. 이제 가까운 사람의 노크가 멈추면 이렇게 알려 드려요.",
        tag: "test",
        url: "./",
      }]);
      return json({ ok: true, sent: r.sent, gone: r.gone, failed: r.failed });
    }
    if (body.action === "key") return json({ key: c.vapid_public });
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
