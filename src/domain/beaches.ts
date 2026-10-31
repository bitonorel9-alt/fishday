/** מעמד חוקי: reserve = בתוך שמורה לפי מקור רשמי, unverified = צריך לאמת גבולות. */
export type LegalStatus = "reserve" | "unverified";

export interface Beach {
  id: string;
  name: string;
  area: string;
  lat: number;
  lon: number;
  /** הכיוון שהחוף פונה אליו, במעלות. טיוטה מהמפה, אוראל יתקן. */
  facing: number;
  /** כמה גל מגיע לחוף גם כשהוא מכוון אליו: 1 = חשוף, 0.6 = מוגן. טיוטה. */
  exposure: number;
  legal: LegalStatus;
  legalNote?: string;
}

const NEAR_SHIKMONA = "ליד שמורת שקמונה, שנמצאת בין מכון חקר ימים לצומת מקסים. בתוכה ההנחיות סותרות, ולכן לא לדוג שם לפני בירור מול רט\"ג.";

export const BEACHES: Beach[] = [
  { id: "bat-galim", name: "בת גלים", area: "חיפה", lat: 32.836, lon: 34.96, facing: 345, exposure: 0.7, legal: "unverified", legalNote: NEAR_SHIKMONA },
  { id: "dado", name: "חוף דדו", area: "חיפה", lat: 32.8, lon: 34.945, facing: 280, exposure: 1, legal: "unverified", legalNote: NEAR_SHIKMONA },
  { id: "kiryat-haim", name: "קריית חיים", area: "מפרץ חיפה", lat: 32.84, lon: 35.04, facing: 290, exposure: 0.6, legal: "unverified" },
  { id: "atlit", name: "עתלית", area: "חוף הכרמל", lat: 32.695, lon: 34.925, facing: 280, exposure: 0.9, legal: "unverified", legalNote: "שמורת ים עתלית מאושרת וטרם מוכרזת. לשים לב לשילוט במקום." },
  { id: "neve-yam", name: "נווה ים", area: "חוף הכרמל", lat: 32.675, lon: 34.918, facing: 280, exposure: 0.9, legal: "unverified", legalNote: "מצפון לשמורת דור-הבונים. לשים לב לגבול ולשילוט." },
  { id: "dor-habonim", name: "הבונים–דור", area: "חוף הכרמל", lat: 32.635, lon: 34.912, facing: 280, exposure: 0.8, legal: "reserve", legalNote: "שמורת ים. הדיג אסור עד קילומטר מהחוף. חכה מהחוף רק בקטע המסומן במפת רט\"ג, ליד המפרץ הצפוני, בלי אמצעי עזר." },
  { id: "maagan-michael", name: "מעגן מיכאל", area: "חוף הכרמל", lat: 32.56, lon: 34.893, facing: 283, exposure: 1, legal: "unverified", legalNote: "ליד שמורת איי דור ומעגן מיכאל. לא מצאתי תקנון מפורט. לשים לב לשילוט." },
];
