import { useState } from "preact/hooks";
import { analyticsConfigured, analyticsEnabled, setAnalyticsOptOut } from "../data/analytics";
import { Page } from "../ui/parts";

export function Privacy() {
  const [on, setOn] = useState(analyticsEnabled);
  return (
    <Page title="פרטיות">
      <section class="card rule">
        <h2>מה נשמר אצלך בטלפון</h2>
        <ul class="plain">
          <li>יומן השלל והתמונות שלו.</li>
          <li>חופים מועדפים, הגדרות ושיא במשחק.</li>
          <li>תחזית אחרונה, כדי שהאפליקציה תעבוד בלי קליטה.</li>
        </ul>
        <p>המידע הזה לא נשלח לשום מקום. מחיקת נתוני האתר בדפדפן מוחקת אותו.</p>
      </section>
      <section class="card rule">
        <h2>מה נשלח החוצה</h2>
        <ul class="plain">
          <li>מיקומי החופים נשלחים ל-Open-Meteo כדי לקבל תחזית. המיקום שלך לא נשלח.</li>
          {analyticsConfigured()
            ? <li>ספירת שימוש אנונימית לשרת של FishDay: מזהה אקראי של המכשיר, אילו מסכים נפתחו, כמה זמן האפליקציה פתוחה, משחקים ושמירת שלל. בלי עוגיות, בלי שם, בלי מיקום ובלי תוכן היומן.</li>
            : <li>כרגע לא נאסף שום נתון שימוש.</li>}
        </ul>
        {analyticsConfigured() && (
          <label class="setting setting-row">
            <span class="setting-label">שליחת נתוני שימוש אנונימיים</span>
            <input type="checkbox" class="switch" role="switch" checked={on} onChange={(e) => { const v = e.currentTarget.checked; setAnalyticsOptOut(!v); setOn(v); }} />
          </label>
        )}
      </section>
      <p class="muted small">עודכן: נובמבר 2026.</p>
    </Page>
  );
}
