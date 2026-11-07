/**
 * ספירת שימוש אנונימית לשרת של FishDay ב-Cloudflare.
 * נשלחים רק: מזהה אקראי של המכשיר, סוג המסך, ואירועים כמו משחק או שמירת שלל.
 * בלי שם, בלי מיקום ובלי תוכן היומן.
 */
export const STATS_URL: string = "https://fishday-stats.bitonorel9.workers.dev";
const OPT_OUT_KEY = "fishday.analytics.off";
const DEVICE_KEY = "fishday.device";
const SESSION_KEY = "fishday.session";

export type StatsEvent = "page" | "session_end" | "game_start" | "game_end" | "catch_saved" | "widget_copied" | "signup" | "error";

// בפיתוח מקומי לא סופרים, כדי לא לערבב בדיקות עם משתמשים אמיתיים.
export const analyticsConfigured = () => STATS_URL !== "" && import.meta.env.PROD;

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

/** מזהה אקראי של המכשיר. משמש גם להרשמה, כדי שרק המכשיר שנרשם יוכל למחוק. */
export const deviceId = () => stableId(localStorage, DEVICE_KEY);

const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

function send(name: StatsEvent, page?: string, value?: number, message?: string) {
  if (!analyticsEnabled()) return;
  try {
    const body = JSON.stringify({
      d: stableId(localStorage, DEVICE_KEY),
      s: stableId(sessionStorage, SESSION_KEY),
      n: name,
      p: page,
      v: value,
      m: message,
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
  if (path.startsWith("/join")) return "/join";
  if (path.startsWith("/feedback")) return "/feedback";
  return path.replace(/^\/(fish|guide)\/[^/]+$/, "/$1/:id");
}

export function trackPage() {
  const page = pageName(location.hash);
  if (page) send("page", page);
}

export function trackEvent(name: Exclude<StatsEvent, "page" | "session_end" | "error">, value?: number) {
  send(name, pageName(location.hash) || undefined, value);
}

/** תקציר קצר של שגיאה: הודעה ושורה ראשונה מהמחסנית, בלי כתובות מלאות. */
export function errorSummary(reason: unknown): string {
  const err = reason instanceof Error ? reason : null;
  const message = err ? `${err.name}: ${err.message}` : String(reason);
  const frame = err?.stack?.split("\n").find((l) => /\.(js|ts|tsx)/.test(l))?.trim() ?? "";
  const where = frame.replace(/https?:\/\/[^\s)]+\//g, "").replace(/^at\s+/, "");
  return (where ? `${message} @ ${where}` : message).slice(0, 300);
}

const reported = new Set<string>();

function reportError(reason: unknown) {
  const summary = errorSummary(reason);
  // אותה שגיאה נשלחת פעם אחת בכל ביקור.
  if (reported.has(summary) || reported.size >= 10) return;
  reported.add(summary);
  send("error", pageName(location.hash) || undefined, undefined, summary);
}

export function startErrorTracking() {
  window.addEventListener("error", (e) => {
    // שגיאות טעינה של תמונה או סקריפט חיצוני מגיעות בלי error.
    if (e.error || e.message) reportError(e.error ?? e.message);
  });
  window.addEventListener("unhandledrejection", (e) => reportError(e.reason));
}

export type FeedbackKind = "score" | "beach" | "rules" | "fish" | "bug" | "idea" | "access" | "other";

/** דיווח ממשתמש. נשלח גם כשהספירה האנונימית כבויה, כי המשתמש שלח אותו בעצמו. */
export async function sendFeedback(kind: FeedbackKind, text: string, page: string, contact: string): Promise<"ok" | "limit" | "failed"> {
  try {
    const r = await fetch(`${STATS_URL}/feedback`, {
      method: "POST",
      body: JSON.stringify({ d: stableId(localStorage, DEVICE_KEY), k: kind, t: text, p: page || undefined, c: contact || undefined }),
    });
    if (r.status === 429) return "limit";
    return r.ok ? "ok" : "failed";
  } catch {
    return "failed";
  }
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
