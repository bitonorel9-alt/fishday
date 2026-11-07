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
          <li>דיווח על טעות נשלח רק כשאתה שולח אותו. פרטי קשר נשמרים רק אם כתבת אותם.</li>
          <li>שגיאות טכניות באפליקציה נשלחות בקצרה (סוג השגיאה והמסך), כדי לתקן אותן. הן נשלחות רק כששליחת הנתונים פעילה.</li>
        </ul>
        {analyticsConfigured() && (
          <label class="setting setting-row">
            <span class="setting-label">שליחת נתוני שימוש אנונימיים</span>
            <input type="checkbox" class="switch" role="switch" checked={on} onChange={(e) => { const v = e.currentTarget.checked; setAnalyticsOptOut(!v); setOn(v); }} />
          </label>
        )}
      </section>
      <section class="card rule">
        <h2>הרשמה</h2>
        <ul class="plain">
          <li>ההרשמה לא חובה. האפליקציה עובדת במלואה גם בלעדיה.</li>
          <li>נשמרים רק שם מלא, מייל, והאם הסכמת לקבל עדכונים.</li>
          <li>המטרה: שדני יפנה אליך בשם, ועדכונים במייל רק אם סימנת שאתה רוצה.</li>
          <li>אין חובה חוקית למסור את הפרטים. הם נשמרים בשרת של FishDay ב-Cloudflare, ולא מועברים לאף אחד.</li>
          <li>אפשר למחוק אותם בכל רגע בהגדרות, או לבקש מחיקה ועיון דרך <a href="#/feedback/other">טופס הפנייה</a>.</li>
          <li>האחראי על המידע: אוראל ביטון, מפתח FishDay.</li>
        </ul>
      </section>
      <p class="muted small">עודכן: נובמבר 2026.</p>
    </Page>
  );
}
