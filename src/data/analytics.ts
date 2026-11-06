/**
 * ספירת שימוש אנונימית דרך Umami: בלי עוגיות ובלי פרטים אישיים.
 * כבוי עד שמגדירים מזהה אתר. המזהה ציבורי ולא סוד.
 */
const UMAMI_WEBSITE_ID = "";
const UMAMI_SRC = "https://cloud.umami.is/script.js";
const OPT_OUT_KEY = "fishday.analytics.off";

type Umami = { track: (event?: string | ((props: Record<string, unknown>) => Record<string, unknown>), data?: Record<string, unknown>) => void };

const umami = () => (window as unknown as { umami?: Umami }).umami;

export function analyticsEnabled(): boolean {
  try {
    return UMAMI_WEBSITE_ID !== "" && localStorage.getItem(OPT_OUT_KEY) !== "1";
  } catch {
    return UMAMI_WEBSITE_ID !== "";
  }
}

export const analyticsConfigured = () => UMAMI_WEBSITE_ID !== "";

export function setAnalyticsOptOut(off: boolean) {
  try {
    if (off) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // אין אחסון: נשאר כמו שהיה.
  }
}

export function startAnalytics() {
  if (!analyticsEnabled() || document.querySelector("script[data-website-id]")) return;
  const s = document.createElement("script");
  s.defer = true;
  s.src = UMAMI_SRC;
  s.dataset.websiteId = UMAMI_WEBSITE_ID;
  // הניווט באפליקציה הוא ב-hash, ולכן סופרים דפים ידנית.
  s.dataset.autoTrack = "false";
  s.onload = () => trackPage();
  document.head.append(s);
}

export function trackPage() {
  if (!analyticsEnabled()) return;
  const page = location.hash.replace(/^#/, "") || "/";
  // לא שולחים מזהים של דגים מהיומן, רק את סוג המסך.
  const safe = page.replace(/^\/(beach|fish|guide)\/.*/, "/$1/:id");
  umami()?.track((props) => ({ ...props, url: safe }));
}

export function trackEvent(name: string, data?: Record<string, string | number | boolean>) {
  if (!analyticsEnabled()) return;
  umami()?.track(name, data);
}
