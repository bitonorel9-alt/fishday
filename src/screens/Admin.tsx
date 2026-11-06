import { useEffect, useState } from "preact/hooks";
import { STATS_URL } from "../data/analytics";
import { readJson, writeJson } from "../data/storage";
import { Page } from "../ui/parts";

const KEY_STORE = "fishday.admin.key";

interface Stats {
  days: number;
  users: { period: number; today: number; week: number };
  sessions: { count: number; avgSec: number; totalHours: number; installedShare: number };
  games: { played: number; avgScore: number; best: number };
  catches: number;
  widgetCopies: number;
  series: { day: string; users: number; sessions: number }[];
  newUsers: { day: string; users: number }[];
  hours: { hour: number; sessions: number }[];
  pages: { page: string; views: number }[];
}

const PAGE_NAMES: Record<string, string> = {
  "/": "בית", "/beaches": "חופים", "/guide": "מדריך", "/fish": "דגים", "/rules": "מה מותר", "/log": "יומן",
  "/game": "משחק", "/settings": "הגדרות", "/widget": "ווידג'ט", "/privacy": "פרטיות", "/fish/:id": "דף דג", "/guide/:id": "מאמר",
};

function pageLabel(page: string): string {
  if (page.startsWith("/beach/")) return `חוף: ${page.slice(7)}`;
  return PAGE_NAMES[page] ?? page;
}

function duration(sec: number): string {
  if (sec < 60) return `${sec} שנ'`;
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")} דק'`;
}

const shortDay = (day: string) => `${Number(day.slice(8))}.${Number(day.slice(5, 7))}`;

/** עמודות לפי ערך אחד. בעברית הזמן זז מימין לשמאל. */
function Bars({ items, label }: { items: { key: string; label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const H = 120, gap = 2;
  const w = 100 / Math.max(items.length, 1);
  return (
    <figure class="admin-chart" aria-label={label}>
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
        <line x1="0" x2="100" y1={H - 0.5} y2={H - 0.5} class="admin-axis" />
        {items.map((it, i) => {
          const h = Math.max(it.value > 0 ? 2 : 0, ((H - 4) * it.value) / max);
          const x = 100 - (i + 1) * w;
          return (
            <g key={it.key}>
              <rect x={x + gap / 4} y={H - h} width={w - gap / 2} height={h} rx="0.8" class="admin-bar">
                <title>{`${it.label}: ${it.value}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      {/* הציר מצויר מימין לשמאל, לכן התוויות מוצגות משמאל לימין בסדר הפוך. */}
      <div class="admin-ticks" dir="ltr">
        {items.filter((_, i) => i === 0 || i === items.length - 1 || i === Math.floor(items.length / 2)).reverse().map((it) => <span key={it.key}>{it.label}</span>)}
      </div>
      <figcaption class="muted small">הכי גבוה: <bdi>{max}</bdi>. מעבר עם העכבר או לחיצה על עמודה מראים את הערך.</figcaption>
    </figure>
  );
}

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div class="card admin-tile">
      <span class="muted small">{label}</span>
      <strong><bdi>{value}</bdi></strong>
      {hint && <span class="muted small">{hint}</span>}
    </div>
  );
}

export function Admin() {
  const [key, setKey] = useState(() => readJson<string>(KEY_STORE) ?? "");
  const [draft, setDraft] = useState("");
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!key || !STATS_URL) return;
    setError("");
    fetch(`${STATS_URL}/stats?days=${days}`, { headers: { Authorization: `Bearer ${key}` } })
      .then(async (r) => {
        if (r.status === 401) throw new Error("המפתח לא נכון.");
        if (!r.ok) throw new Error(`השרת החזיר שגיאה ${r.status}.`);
        setStats((await r.json()) as Stats);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "אין חיבור לשרת."));
  }, [key, days]);

  if (!STATS_URL) return <Page title="בקרה"><p class="muted">שרת הסטטיסטיקה עוד לא מחובר.</p></Page>;

  if (!key) {
    return (
      <Page title="בקרה">
        <form class="card log-form" onSubmit={(e) => { e.preventDefault(); writeJson(KEY_STORE, draft.trim()); setKey(draft.trim()); }}>
          <label class="field"><span>מפתח בקרה</span>
            <input type="password" autoComplete="off" value={draft} onInput={(e) => setDraft(e.currentTarget.value)} required />
          </label>
          <button type="submit" class="primary">כניסה</button>
        </form>
      </Page>
    );
  }

  const daily = (stats?.series ?? []).map((s) => ({ key: s.day, label: shortDay(s.day), value: s.users }));
  const hours = Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: `${h}:00`, value: stats?.hours.find((x) => x.hour === h)?.sessions ?? 0 }));
  const newTotal = (stats?.newUsers ?? []).reduce((a, b) => a + b.users, 0);

  return (
    <Page title="בקרה">
      <div class="segment" role="group" aria-label="טווח">
        {[7, 30, 90].map((d) => <button type="button" key={d} aria-pressed={d === days} onClick={() => setDays(d)}>{d} ימים</button>)}
      </div>
      {error && <p class="alert" role="alert">{error} <button type="button" class="link-danger" onClick={() => { writeJson(KEY_STORE, ""); setKey(""); }}>החלף מפתח</button></p>}
      {!stats && !error && <p class="muted" role="status">טוען…</p>}
      {stats && (
        <>
          <div class="admin-tiles">
            <Tile label="משתמשים היום" value={stats.users.today} />
            <Tile label="משתמשים ב-7 ימים" value={stats.users.week} />
            <Tile label={`משתמשים ב-${stats.days} ימים`} value={stats.users.period} hint={`${newTotal} חדשים`} />
            <Tile label="ביקורים" value={stats.sessions.count} />
            <Tile label="זמן ממוצע בביקור" value={duration(stats.sessions.avgSec)} />
            <Tile label="שעות שימוש" value={stats.sessions.totalHours} />
            <Tile label="משחקים" value={stats.games.played} hint={stats.games.played ? `ממוצע ${stats.games.avgScore}, שיא ${stats.games.best}` : undefined} />
            <Tile label="שלל שנשמר" value={stats.catches} />
            <Tile label="מותקנת כאפליקציה" value={`${stats.sessions.installedShare}%`} hint="מהביקורים" />
          </div>

          <section class="card rule">
            <h2>משתמשים לפי יום</h2>
            {daily.length ? <Bars items={daily} label="משתמשים לפי יום" /> : <p class="muted">אין עדיין נתונים.</p>}
          </section>

          <section class="card rule">
            <h2>מתי נכנסים</h2>
            <Bars items={hours} label="ביקורים לפי שעה ביום" />
          </section>

          <section class="card rule">
            <h2>מסכים פופולריים</h2>
            <table class="admin-table">
              <thead><tr><th>מסך</th><th>צפיות</th></tr></thead>
              <tbody>{stats.pages.map((p) => <tr key={p.page}><td>{pageLabel(p.page)}</td><td><bdi>{p.views}</bdi></td></tr>)}</tbody>
            </table>
          </section>
          <p class="muted small">ווידג'טים שהועתקו: <bdi>{stats.widgetCopies}</bdi>. משתמש הוא מכשיר: אותו אדם בשני מכשירים נספר פעמיים.</p>
        </>
      )}
    </Page>
  );
}
