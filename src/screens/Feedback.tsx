import { useState } from "preact/hooks";
import { sendFeedback, type FeedbackKind } from "../data/analytics";
import { Page } from "../ui/parts";

export const FEEDBACK_KINDS: [FeedbackKind, string][] = [
  ["score", "ציון או תחזית לא נכונים"],
  ["beach", "טעות בפרטי חוף"],
  ["rules", "טעות בחוקים"],
  ["fish", "טעות במידע על דג"],
  ["bug", "משהו לא עובד"],
  ["access", "בעיית נגישות"],
  ["idea", "רעיון או בקשה"],
  ["other", "אחר"],
];

const isKind = (k: string): k is FeedbackKind => FEEDBACK_KINDS.some(([v]) => v === k);

/** קישור "דווח על טעות" מתוך מסך. המסך שממנו הגיעו נשמר עם הדיווח. */
export function ReportLink({ kind, label = "מצאת טעות? דווח לנו" }: { kind: FeedbackKind; label?: string }) {
  const from = encodeURIComponent(location.hash.replace(/^#/, "") || "/");
  return <a class="report-link small" href={`#/feedback/${kind}/${from}`}>{label}</a>;
}

export function Feedback({ route }: { route: string }) {
  // #/feedback/<סוג>/<המסך המקורי, מקודד>
  const [rawKind = "", rawFrom = ""] = route.replace(/^#\/feedback\/?/, "").split("/");
  let from = "";
  try {
    from = decodeURIComponent(rawFrom).slice(0, 60);
  } catch {
    // כתובת פגומה: שולחים בלי מסך.
  }
  const [kind, setKind] = useState<FeedbackKind>(isKind(rawKind) ? rawKind : "other");
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "limit" | "failed">("idle");

  if (state === "ok") {
    return (
      <Page title="תודה!">
        <section class="card rule">
          <p>הדיווח הגיע. כל דיווח נקרא, ותיקונים עולים מהר ככל האפשר.</p>
          <a class="primary btn-link" href={from ? `#${from}` : "#/"}>חזרה</a>
        </section>
      </Page>
    );
  }

  return (
    <Page title="דווח על טעות">
      <form class="card log-form" onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setState(await sendFeedback(kind, text.trim(), from, contact.trim()));
      }}>
        <label class="field"><span>על מה הדיווח</span>
          <select value={kind} onChange={(e) => setKind(e.currentTarget.value as FeedbackKind)}>
            {FEEDBACK_KINDS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </label>
        <label class="field"><span>מה קרה</span>
          <textarea rows={5} minLength={3} maxLength={1000} required value={text}
            placeholder="למשל: בחוף עתלית יש היום גלים גבוהים, והציון היה 9."
            onInput={(e) => setText(e.currentTarget.value)} />
          <span class="muted small"><bdi dir="ltr">{text.length}/1000</bdi> תווים</span>
        </label>
        <label class="field"><span>איך לחזור אליך (לא חובה)</span>
          <input type="text" maxLength={100} autoComplete="email" value={contact} placeholder="אימייל או טלפון"
            onInput={(e) => setContact(e.currentTarget.value)} />
        </label>
        {from && <p class="muted small">יצורף המסך שממנו הגעת: <bdi dir="ltr">{from}</bdi></p>}
        {state === "failed" && <p class="alert" role="alert">לא הצלחתי לשלוח. בדוק חיבור ונסה שוב.</p>}
        {state === "limit" && <p class="alert" role="alert">שלחת הרבה דיווחים היום. נסה שוב מחר.</p>}
        <button type="submit" class="primary" disabled={state === "sending"}>{state === "sending" ? "שולח…" : "שליחה"}</button>
        <p class="muted small">הדיווח נשמר בשרת של FishDay יחד עם מזהה אקראי של המכשיר. פרטי קשר נשמרים רק אם כתבת אותם, ומשמשים רק לתשובה. <a href="#/privacy">פרטיות</a></p>
      </form>
    </Page>
  );
}
