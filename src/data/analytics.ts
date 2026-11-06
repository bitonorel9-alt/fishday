/**
 * ספירת שימוש אנונימית לשרת של FishDay ב-Cloudflare.
 * נשלחים רק: מזהה אקראי של המכשיר, סוג המסך, ואירועים כמו משחק או שמירת שלל.
 * בלי שם, בלי מיקום ובלי תוכן היומן.
 */
export const STATS_URL: string = "https://fishday-stats.bitonorel9.workers.dev";
const OPT_OUT_KEY = "fishday.analytics.off";
const DEVICE_KEY = "fishday.device";
const SESSION_KEY = "fishday.session";

export type StatsEvent = "page" | "session_end" | "game_start" | "game_end" | "catch_saved" | "widget_copied";

export const analyticsConfigured = () => STATS_URL !== "";

export function analyticsEnabled(): boolean {
  try {
    return analyticsConfigured() && localStorage.getItem(OPT_OUT_KEY) !== "1";
  } catch {
    return false;
  }
}

export function setAnalyticsOptOut(off: boolean) {
  try {
    if (off) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // אין אחסון: ממילא לא נשלח כלום.
  }
}

function stableId(storage: Storage, key: string): string {
  let id = storage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(key, id);
  }
  return id;
}

const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

function send(name: StatsEvent, page?: string, value?: number) {
  if (!analyticsEnabled()) return;
  try {
    const body = JSON.stringify({
      d: stableId(localStorage, DEVICE_KEY),
      s: stableId(sessionStorage, SESSION_KEY),
      n: name,
      p: page,
      v: value,
      a: standalone(),
    });
    // sendBeacon עובד גם כשסוגרים את האפליקציה, ולא דורש בדיקת CORS מקדימה.
    if (!navigator.sendBeacon?.(`${STATS_URL}/e`, body)) {
      void fetch(`${STATS_URL}/e`, { method: "POST", body, keepalive: true }).catch(() => undefined);
    }
  } catch {
    // סטטיסטיקה לעולם לא שוברת את האפליקציה.
  }
}

/** מזהי חופים ודגים נשמרים כסוג מסך, כדי לדעת מה מעניין בלי לשמור יותר מהנדרש. */
export function pageName(hash: string): string {
  const path = hash.replace(/^#/, "") || "/";
  if (path === "/admin") return "";
  return path.replace(/^\/(fish|guide)\/[^/]+$/, "/$1/:id");
}

export function trackPage() {
  const page = pageName(location.hash);
  if (page) send("page", page);
}

export function trackEvent(name: Exclude<StatsEvent, "page" | "session_end">, value?: number) {
  send(name, pageName(location.hash) || undefined, value);
}

let visibleSince = Date.now();

export function startAnalytics() {
  if (!analyticsEnabled()) return;
  trackPage();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      send("session_end", undefined, Math.round((Date.now() - visibleSince) / 1000));
    } else {
      visibleSince = Date.now();
    }
  });
}
