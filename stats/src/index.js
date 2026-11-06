// שרת הסטטיסטיקה של FishDay: מקבל אירועים אנונימיים מהאפליקציה ומחזיר סיכומים ללוח הבקרה.
const ALLOWED_ORIGINS = ["https://bitonorel9-alt.github.io", "http://localhost:4173", "http://localhost:5173"];
const EVENTS = new Set(["page", "session_end", "game_start", "game_end", "catch_saved", "widget_copied"]);
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
  const { day, hour } = israelParts(new Date());
  await env.DB.prepare("INSERT INTO events (ts, day, hour, device, session, name, page, num, app) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(Date.now(), day, hour, e.d, e.s, e.n, page, num, e.a ? 1 : 0)
    .run();
  return new Response(null, { status: 204, headers });
}

function daysAgo(n) {
  return israelParts(new Date(Date.now() - n * 86400000)).day;
}

async function stats(request, env, url, headers) {
  const auth = request.headers.get("Authorization") ?? "";
  if (!env.STATS_KEY || auth !== `Bearer ${env.STATS_KEY}`) return new Response("unauthorized", { status: 401, headers });
  const days = Math.max(1, Math.min(90, Number(url.searchParams.get("days")) || 30));
  const since = daysAgo(days - 1);
  const today = daysAgo(0);
  const week = daysAgo(6);
  const db = env.DB;
  const one = (sql, ...args) => db.prepare(sql).bind(...args).first();
  const all = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results;

  const [totals, todayRow, weekRow, sessions, games, catches, widget, series, hours, pages, firstSeen] = await Promise.all([
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
  }, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = cors(request.headers.get("Origin") ?? "");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method === "POST" && url.pathname === "/e") return collect(request, env, headers);
    if (request.method === "GET" && url.pathname === "/stats") return stats(request, env, url, headers);
    return new Response("FishDay stats", { status: 404, headers });
  },
};
