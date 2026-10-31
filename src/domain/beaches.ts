/** reserve = בתוך שמורה ימית, near = ליד שמורה או אזור אסור, open = לא נמצאה מגבלת שמורה. */
export type LegalStatus = "reserve" | "near" | "open";

export type Bottom = "rock" | "sand" | "mixed";

export interface Beach {
  id: string;
  name: string;
  area: string;
  lat: number;
  lon: number;
  /** הכיוון שהחוף פונה אליו, נמדד מקו החוף ב-OpenStreetMap. */
  facing: number;
  /** טווח כיווני גל שיבשה חוסמת, נמדד מהחוף ועד 6 ק"מ. */
  shelteredFrom?: [number, number];
  bottom: Bottom;
  shore: string;
  legal: LegalStatus;
  legalNote?: string;
}

export const BEACHES: Beach[] = [
  {
    id: "bat-galim", name: "בת גלים", area: "חיפה", lat: 32.836, lon: 34.96, facing: 335, shelteredFrom: [190, 250], bottom: "rock",
    shore: "חוף סלעי עם שובר גלים. פונה לצפון-מערב, וראש הכרמל חוסם גלים מדרום-מערב.",
    legal: "near", legalNote: "שמורת שקמונה מתחילה ממערב, במכון חקר ימים. אסור לדוג על שוברי הגלים של נמל חיפה או בתוכם.",
  },
  {
    id: "dado", name: "חוף דדו", area: "חיפה", lat: 32.8, lon: 34.945, facing: 270, bottom: "sand",
    shore: "חוף חולי פתוח למערב, עם שובר גלים.",
    legal: "near", legalNote: "שמורת שקמונה נגמרת מצפון, ליד מסעדת מקסים. בתוכה מותרת רק חכה מהחוף.",
  },
  {
    id: "kiryat-haim", name: "קריית חיים", area: "מפרץ חיפה", lat: 32.84, lon: 35.04, facing: 293, shelteredFrom: [190, 265], bottom: "sand",
    shore: "חוף חולי בתוך מפרץ חיפה. פתוח רק לצפון-מערב, ומוגן מגלים דרום-מערביים ומערביים.",
    legal: "open",
  },
  {
    id: "atlit", name: "עתלית", area: "חוף הכרמל", lat: 32.695, lon: 34.925, facing: 275, bottom: "rock",
    shore: "חוף מסולע שפונה למערב.",
    legal: "open", legalNote: "מצפון לחוף נמצאים מבצר עתלית ובסיס חיל הים. לא להיכנס לשטח סגור.",
  },
  {
    id: "neve-yam", name: "נווה ים", area: "חוף הכרמל", lat: 32.675, lon: 34.918, facing: 267, bottom: "sand",
    shore: "חוף חולי ומשפחתי שפונה למערב.",
    legal: "near", legalNote: "שמורת דור-הבונים מתחילה בנחל מערות, בדיונה השנייה מדרום לנווה ים.",
  },
  {
    id: "dor-habonim", name: "הבונים–דור", area: "חוף הכרמל", lat: 32.635, lon: 34.912, facing: 273, bottom: "rock",
    shore: "חוף מפורץ עם מפרצונים וטבלאות סלע.",
    legal: "reserve", legalNote: "שמורת ים. הדיג אסור, למעט חכה מהחוף בקטע קצר במפרץ הצפוני, בלי אמצעי עזר. בדוק במפת רט\"ג ובשילוט.",
  },
  {
    id: "maagan-michael", name: "מעגן מיכאל", area: "חוף הכרמל", lat: 32.56, lon: 34.893, facing: 286, bottom: "sand",
    shore: "חוף חולי ברובו, לא מוסדר ובלי מציל.",
    legal: "near", legalNote: "אסור לדוג על איי דור ומעגן מיכאל, וגם עד 150 מטר מהם.",
  },
];

/** לפי סוג החוף ומחקר על דיג מהחוף בישראל, לא לפי דיווחים מחוף מסוים. */
export const LIKELY_FISH: Record<Bottom, string> = {
  rock: "סרגוס, סיכן (ארס), קיפונים (בורי)",
  sand: "סילגו, מרמיר, קיפונים (בורי)",
  mixed: "סרגוס, סילגו, קיפונים (בורי)",
};

export const BOTTOM_LABEL: Record<Bottom, string> = {
  rock: "סלעי",
  sand: "חולי",
  mixed: "מעורב",
};
