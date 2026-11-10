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

async function sendTo(msgs: Msg[]) {
  if (!msgs.length) return { sent: 0, gone: 0, failed: 0 };
  const ids = [...new Set(msgs.map((m) => m.user_id))];
  const { data: subs, error } = await db.from("push_subs").select("endpoint,user_id,p256dh,auth").in("user_id", ids);
  if (error) throw error;
  let sent = 0, gone = 0, failed = 0;
  const jobs: Promise<void>[] = [];
  for (const m of msgs) {
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
            await db.from("push_subs").update({ last_ok_at: new Date().toISOString() }).eq("endpoint", s.endpoint);
          })
          .catch(async (e: { statusCode?: number; body?: string }) => {
            if (e && (e.statusCode === 404 || e.statusCode === 410)) {
              gone++;
              await db.from("push_subs").delete().eq("endpoint", s.endpoint);
            } else {
              failed++;
              console.error("push fail", e && e.statusCode, e && e.body);
            }
          }),
      );
    }
  }
  await Promise.all(jobs);
  return { sent, gone, failed };
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
      const r = await sendTo((data || []) as Msg[]);
      // 10분마다: 혼자인 채로 24시간 지난 노크방 정리 (구성원·노크 기록은 함께 지워져요)
      let cleaned = 0;
      if (new Date().getUTCMinutes() % 10 === 0) {
        const { data: lonely } = await db.rpc("_lonely_rooms");
        const ids = (lonely || []).map((x: { id: string }) => x.id);
        if (ids.length) {
          const { error: delErr } = await db.from("rooms").delete().in("id", ids);
          if (delErr) console.error("lonely cleanup", delErr.message); else cleaned = ids.length;
        }
      }
      return json({ ok: true, picked: (data || []).length, cleaned, ...r });
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
      return json({ ok: true, ...r });
    }
    if (body.action === "key") return json({ key: c.vapid_public });
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
