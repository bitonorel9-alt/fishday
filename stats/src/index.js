// שרת הסטטיסטיקה של FishDay: מקבל אירועים אנונימיים מהאפליקציה ומחזיר סיכומים ללוח הבקרה.
const ALLOWED_ORIGINS = ["https://bitonorel9-alt.github.io", "http://localhost:4173", "http://localhost:5173"];
const EVENTS = new Set(["page", "session_end", "game_start", "game_end", "catch_saved", "widget_copied", "signup", "error"]);
const KINDS = new Set(["score", "beach", "rules", "fish", "bug", "idea", "access", "other"]);
const MAX_FEEDBACK_PER_DAY = 10;
const MAX_ERRORS_PER_DAY = 20;
const MAX_SIGNUPS_PER_DAY = 5;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const ID = /^[0-9a-f-]{8,40}$/;
const MAX_SESSION_SEC = 4 * 3600;

const israel = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });

function israelParts(date) {
  const p = Object.fromEntries(israel.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

async function collect(request, env, headers) {
  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return new Response(null, { status: 403, headers });
  const text = await request.text();
  if (text.length > 1024) return new Response(null, { status: 413, headers });
  let e;
  try {
    e = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers });
  }
  if (!ID.test(String(e.d)) || !ID.test(String(e.s)) || !EVENTS.has(e.n)) return new Response(null, { status: 400, headers });
  const page = typeof e.p === "string" ? e.p.slice(0, 60) : null;
  const num = typeof e.v === "number" && Number.isFinite(e.v) ? Math.max(0, Math.min(e.v, MAX_SESSION_SEC)) : null;
  const msg = e.n === "error" && typeof e.m === "string" ? e.m.slice(0, 300) : null;
  const { day, hour } = israelParts(new Date());
  if (e.n === "error") {
    // שגיאה שחוזרת בלולאה לא תמלא את המסד.
    const seen = await env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE name = 'error' AND device = ? AND day = ?").bind(e.d, day).first();
    if ((seen?.n ?? 0) >= MAX_ERRORS_PER_DAY) return new Response(null, { status: 204, headers });
  }
  await env.DB.prepare("INSERT INTO events (ts, day, hour, device, session, name, page, num, app, msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(Date.now(), day, hour, e.d, e.s, e.n, page, num, e.a ? 1 : 0, msg)
    .run();
  return new Response(null, { status: 204, headers });
}

async function feedback(request, env, headers) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return new Response(null, { status: 403, headers });
  const text = await request.text();
  if (text.length > 4096) return new Response(null, { status: 413, headers });
  let f;
  try {
    f = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers });
  }
  const body = typeof f.t === "string" ? f.t.trim().slice(0, 1000) : "";
  if (!ID.test(String(f.d)) || !KINDS.has(f.k) || body.length < 3) return new Response(null, { status: 400, headers });
  const { day } = israelParts(new Date());
  const seen = await env.DB.prepare("SELECT COUNT(*) AS n FROM feedback WHERE device = ? AND day = ?").bind(f.d, day).first();
  if ((seen?.n ?? 0) >= MAX_FEEDBACK_PER_DAY) return new Response(null, { status: 429, headers });
  const page = typeof f.p === "string" ? f.p.slice(0, 60) : null;
  const contact = typeof f.c === "string" && f.c.trim() ? f.c.trim().slice(0, 100) : null;
  await env.DB.prepare("INSERT INTO feedback (ts, day, device, kind, page, text, contact) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(Date.now(), day, f.d, f.k, page, body, contact)
    .run();
  return new Response(null, { status: 204, headers });
}

async function readJson(request, headers, max) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return { error: new Response(null, { status: 403, headers }) };
  const text = await request.text();
  if (text.length > max) return { error: new Response(null, { status: 413, headers }) };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: new Response(null, { status: 400, headers }) };
  }
}

/** הרשמה: שם ומייל. אותו מייל שנרשם שוב מעדכן את הפרטים, אבל רק מהמכשיר שרשם אותו: אחרת כל אחד יכול לשנות פרטים של אדם אחר. */
async function signup(request, env, headers) {
  const { body: m, error } = await readJson(request, headers, 1024);
  if (error) return error;
  const name = typeof m.n === "string" ? m.n.trim().replace(/\s+/g, " ") : "";
  const email = typeof m.e === "string" ? m.e.trim().toLowerCase() : "";
  if (!ID.test(String(m.d)) || name.length < 2 || name.length > 60 || email.length > 254 || !EMAIL.test(email)) return new Response(null, { status: 400, headers });
  const dayStart = Date.now() - 86400000;
  const seen = await env.DB.prepare("SELECT COUNT(*) AS n FROM members WHERE device = ? AND updated > ?").bind(m.d, dayStart).first();
  if ((seen?.n ?? 0) >= MAX_SIGNUPS_PER_DAY) return new Response(null, { status: 429, headers });
  const now = Date.now();
  await env.DB.prepare("INSERT INTO members (email, name, updates, device, created, updated) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name, updates = excluded.updates, updated = excluded.updated WHERE members.device = excluded.device")
    .bind(email, name, m.u ? 1 : 0, m.d, now, now)
    .run();
  return new Response(null, { status: 204, headers });
}

/** מחיקה מהמכשיר שנרשם: צריך גם את המייל וגם את מזהה המכשיר, כדי שאי אפשר יהיה למחוק אדם אחר. */
async function unsubscribe(request, env, headers) {
  const { body: m, error } = await readJson(request, headers, 512);
  if (error) return error;
  const email = typeof m.e === "string" ? m.e.trim().toLowerCase() : "";
  if (!ID.test(String(m.d)) || !EMAIL.test(email)) return new Response(null, { status: 400, headers });
  await env.DB.prepare("DELETE FROM members WHERE email = ? AND device = ?").bind(email, m.d).run();
  return new Response(null, { status: 204, headers });
}

function daysAgo(n) {
  return israelParts(new Date(Date.now() - n * 86400000)).day;
}

async function stats(request, env, url, headers) {
  const auth = request.headers.get("Authorization") ?? "";
  if (!env.STATS_KEY || !(await sameSecret(auth, `Bearer ${env.STATS_KEY}`))) return new Response("unauthorized", { status: 401, headers });
  const days = Math.max(1, Math.min(90, Number(url.searchParams.get("days")) || 30));
  const since = daysAgo(days - 1);
  const today = daysAgo(0);
  const week = daysAgo(6);
  const db = env.DB;
  const one = (sql, ...args) => db.prepare(sql).bind(...args).first();
  const all = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results;

  const [totals, todayRow, weekRow, sessions, games, catches, widget, series, hours, pages, firstSeen, errorRow, errors, reports, memberRow, members] = await Promise.all([
    one("SELECT COUNT(DISTINCT device) AS users, COUNT(DISTINCT session) AS sessions FROM events WHERE day >= ?", since),
    one("SELECT COUNT(DISTINCT device) AS users FROM events WHERE day = ?", today),
    one("SELECT COUNT(DISTINCT device) AS users FROM events WHERE day >= ?", week),
    one("SELECT COUNT(*) AS n, AVG(num) AS avg, SUM(num) AS total, AVG(app) AS installed FROM events WHERE name = 'session_end' AND day >= ? AND num > 0", since),
    one("SELECT COUNT(*) AS played, AVG(num) AS avg, MAX(num) AS best FROM events WHERE name = 'game_end' AND day >= ?", since),
    one("SELECT COUNT(*) AS n FROM events WHERE name = 'catch_saved' AND day >= ?", since),
    one("SELECT COUNT(*) AS n FROM events WHERE name = 'widget_copied' AND day >= ?", since),
    all("SELECT day, COUNT(DISTINCT device) AS users, COUNT(DISTINCT session) AS sessions FROM events WHERE day >= ? GROUP BY day ORDER BY day", since),
    all("SELECT hour, COUNT(DISTINCT session) AS sessions FROM events WHERE day >= ? GROUP BY hour ORDER BY hour", since),
    all("SELECT page, COUNT(*) AS views FROM events WHERE name = 'page' AND day >= ? GROUP BY page ORDER BY views DESC LIMIT 12", since),
    all("SELECT day, COUNT(*) AS users FROM (SELECT device, MIN(day) AS day FROM events GROUP BY device) WHERE day >= ? GROUP BY day ORDER BY day", since),
    one("SELECT COUNT(*) AS n, COUNT(DISTINCT device) AS devices FROM events WHERE name = 'error' AND day >= ?", since),
    all("SELECT msg, MAX(page) AS page, COUNT(*) AS n, COUNT(DISTINCT device) AS devices, MAX(ts) AS last FROM events WHERE name = 'error' AND day >= ? GROUP BY msg ORDER BY last DESC LIMIT 15", since),
    all("SELECT ts, kind, page, text, contact FROM feedback ORDER BY ts DESC LIMIT 50"),
    one("SELECT COUNT(*) AS n, SUM(updates) AS updates, SUM(created >= ?) AS recent FROM members", Date.now() - days * 86400000),
    all("SELECT name, email, updates, created FROM members ORDER BY created DESC LIMIT 100"),
  ]);

  return Response.json({
    days,
    since,
    users: { period: totals?.users ?? 0, today: todayRow?.users ?? 0, week: weekRow?.users ?? 0 },
    sessions: { count: totals?.sessions ?? 0, avgSec: Math.round(sessions?.avg ?? 0), totalHours: Math.round(((sessions?.total ?? 0) / 3600) * 10) / 10, installedShare: Math.round((sessions?.installed ?? 0) * 100) },
    games: { played: games?.played ?? 0, avgScore: Math.round(games?.avg ?? 0), best: games?.best ?? 0 },
    catches: catches?.n ?? 0,
    widgetCopies: widget?.n ?? 0,
    series,
    newUsers: firstSeen,
    hours,
    pages,
    errors: { count: errorRow?.n ?? 0, devices: errorRow?.devices ?? 0, top: errors },
    feedback: reports,
    members: { count: memberRow?.n ?? 0, updates: memberRow?.updates ?? 0, recent: memberRow?.recent ?? 0, list: members },
  }, { headers });
}

/** השוואת מפתח בזמן קבוע, כדי שאי אפשר יהיה לנחש אותו לפי זמני תגובה. */
async function sameSecret(given, expected) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
  return crypto.subtle.timingSafeEqual(a, b);
}

/**
 * הגבלת קצב לפי כתובת IP, נפרדת לכל נתיב. הכתובת משמשת רק כמפתח זמני בזיכרון של Cloudflare ולא נשמרת.
 * בלי ה-binding (למשל בפיתוח מקומי) הבדיקה מדולגת.
 */
async function allowed(request, env, url) {
  if (!env.LIMITER) return true;
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const { success } = await env.LIMITER.limit({ key: `${url.pathname}:${ip}` });
  return success;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = { ...cors(request.headers.get("Origin") ?? ""), "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (!(await allowed(request, env, url))) return new Response(null, { status: 429, headers });
    if (request.method === "POST" && url.pathname === "/e") return collect(request, env, headers);
    if (request.method === "POST" && url.pathname === "/signup") return signup(request, env, headers);
    if (request.method === "POST" && url.pathname === "/signup/delete") return unsubscribe(request, env, headers);
    if (request.method === "POST" && url.pathname === "/feedback") return feedback(request, env, headers);
    if (request.method === "GET" && url.pathname === "/stats") return stats(request, env, url, headers);
    return new Response("FishDay stats", { status: 404, headers });
  },
};
