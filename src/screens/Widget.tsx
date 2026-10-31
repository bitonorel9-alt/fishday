import { useState } from "preact/hooks";
import { Page } from "../ui/parts";

const SCRIPT_URL = `${import.meta.env.BASE_URL}widget/fishday-widget.js`;

export function Widget() {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    try {
      const code = await (await fetch(SCRIPT_URL)).text();
      await navigator.clipboard.writeText(code);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <Page title="ווידג'ט לאייפון">
      <p class="muted">ציון חי של החוף הכי טוב, גלים ורוח על מסך הבית. מתעדכן בערך כל 30 דקות.</p>

      <div class="widget-preview" aria-hidden="true">
        <span class="widget-brand">FishDay</span>
        <div class="widget-main"><b>8.5</b><span><strong>עתלית</strong><small>מצוין</small></span></div>
        <small>גל 0.6 מ' · רוח 12 קמ"ש · שקיעה 16:50</small>
      </div>

      <section class="card rule">
        <h2>איך מוסיפים</h2>
        <ol class="steps">
          <li>התקן מ-App Store את <a href="https://apps.apple.com/app/scriptable/id1405459188" target="_blank" rel="noopener">Scriptable</a>. היא חינמית.</li>
          <li><button type="button" class="primary" onClick={() => void copy()}>העתק את קוד הווידג'ט</button>
            {copied === "done" && <span class="copied" role="status">הועתק</span>}
            {copied === "failed" && <span class="copied" role="alert">ההעתקה נכשלה. <a href={SCRIPT_URL} target="_blank" rel="noopener">פתח את הקוד</a></span>}
          </li>
          <li>פתח את Scriptable, לחץ על + למעלה, הדבק, וקרא לסקריפט FishDay.</li>
          <li>לחץ על ▶ פעם אחת, כדי לראות שהוא עובד.</li>
          <li>במסך הבית לחץ לחיצה ארוכה, ואז עריכה והוספת וידג'ט. בחר Scriptable, גודל בינוני או קטן.</li>
          <li>לחץ לחיצה ארוכה על הווידג'ט, בחר עריכה, ובשדה Script בחר FishDay.</li>
        </ol>
        <p class="muted small">רוצה חוף קבוע? בשדה Parameter כתוב את שם החוף, למשל עתלית.</p>
      </section>

      <section class="card rule">
        <h2>למה דרך Scriptable?</h2>
        <p>אפל מאפשרת ווידג'ט רק לאפליקציה מהחנות. FishDay היא אפליקציית רשת, ולכן Scriptable מריצה את הווידג'ט במקומה.</p>
      </section>
    </Page>
  );
}
