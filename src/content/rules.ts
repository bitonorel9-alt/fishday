export interface Source {
  label: string;
  url: string;
  updated: string;
}

export const RULES_CHECKED_AT = "31.10.2026";

export const SOURCES = {
  season: { label: "אגף הדיג: הודעת תקופות 2026", url: "https://www.gov.il/he/pages/fishing_mediterranean_2026", updated: "17.2.2026" },
  seasonParks: { label: "רט\"ג: הגבלות עונתיות", url: "https://www.parks.org.il/article/%D7%94%D7%92%D7%91%D7%9C%D7%95%D7%AA-%D7%94%D7%93%D7%99%D7%92-%D7%91%D7%A2%D7%95%D7%A0%D7%95%D7%AA-%D7%94%D7%A8%D7%91%D7%99%D7%99%D7%94-%D7%95%D7%94%D7%92%D7%99%D7%95%D7%A1-%D7%91%D7%99%D7%9D-%D7%94/", updated: "18.3.2026" },
  sizes: { label: "רט\"ג: אורכי מינימום", url: "https://www.parks.org.il/article/fish-length/", updated: "12.12.2024" },
  sport: { label: "רט\"ג: תקנות דיג ספורטיבי", url: "https://www.parks.org.il/article/%D7%93%D7%99%D7%92-%D7%A1%D7%A4%D7%95%D7%A8%D7%98%D7%99%D7%91%D7%99/", updated: "ללא תאריך באתר" },
  booklet: { label: "רט\"ג: חוברת מידע לדייג", url: "https://www.parks.org.il/article/fish-tk/", updated: "22.6.2025" },
  protected: { label: "רט\"ג: מינים מוגנים ושמורות", url: "https://www.parks.org.il/article/%D7%AA%D7%96%D7%9B%D7%95%D7%A8%D7%AA-%D7%A9%D7%9E%D7%95%D7%A8%D7%95%D7%AA-%D7%98%D7%91%D7%A2-%D7%99%D7%9E%D7%99%D7%95%D7%AA-%D7%95%D7%A2%D7%A8%D7%9B%D7%99-%D7%98%D7%91%D7%A2-%D7%9E%D7%95/", updated: "23.10.2017" },
  reservesMap: { label: "רט\"ג: עלון שמורות בצפון", url: "https://static.parks.org.il/wp-content/uploads/2023/06/yam-north.pdf", updated: "2023" },
  roshCarmel: { label: "רט\"ג: הודעה על ראש כרמל", url: "https://static.parks.org.il/wp-content/uploads/2022/11/%D7%A2%D7%91%D7%A8%D7%99%D7%AA-%D7%A9%D7%9E%D7%95%D7%A8%D7%AA-%D7%98%D7%91%D7%A2-%D7%99%D7%9E%D7%99%D7%AA-%D7%A8%D7%90%D7%A9-%D7%9B%D7%A8%D7%9E%D7%9C-%D7%94%D7%95%D7%93%D7%A2%D7%94-%D7%9C%D7%A6%D7%99%D7%91%D7%95%D7%A8-2024.pdf", updated: "2024" },
} satisfies Record<string, Source>;

export interface Season {
  year: number;
  start: string;
  end: string;
}

/** מתעדכן מדי שנה לפי הודעת פקיד הדיג הראשי. */
export const BREEDING_SEASON: Season = { year: 2026, start: "2026-05-01", end: "2026-06-30" };

export type SeasonState = "before" | "during" | "after" | "unknown";

export function seasonState(today: string, season: Season = BREEDING_SEASON): SeasonState {
  if (Number(today.slice(0, 4)) !== season.year) return "unknown";
  if (today < season.start) return "before";
  return today > season.end ? "after" : "during";
}

export const BREEDING_BANNED = [
  "פרידה (ספרוס מצוי)",
  "לוקוס (כל משפחת הדקרים)",
  "מנורין (אובלד שחור זנב)",
  "מרמיר (שישן מסורטט)",
  "חדד, פיז'מה (סרגוס הפסים)",
  "מוסר (מוסר מלכותי)",
  "מוסר סלע, סאינס (אוכם גדול קוץ)",
  "קורבינה, לבט (יבלן האדווה)",
];

export const PROTECTED = [
  "דקר אלכסנדרוני",
  "כל הכרישים והבטאים, כולל גיטרן וחתולי ים",
  "כפן גושמני (לובסטר)",
  "כל היונקים הימיים",
  "כל צבי הים",
];

export interface Fish {
  name: string;
  formal: string;
  minCm: number;
  note?: string;
}

const row = (minCm: number, list: [string, string, string?][]): Fish[] =>
  list.map(([name, formal, note]) => ({ name, formal, minCm, ...(note ? { note } : {}) }));

export const SEA_FISH: Fish[] = [
  ...row(11, [
    ["ז'רבידן", "ורדית מצויה"], ["מנורין", "אובלד שחור זנב"], ["מרמיר", "שישן מסורטט"], ["רופוס", "גובוס גלילי"],
    ["סרגוס", "סרגוס מסורטט"], ["סרגוס חדאדי", "סרגוס הפסים"], ["סרגוס הטבעת", "סרגוס הטבעת"],
    ["סולטן אברהים", "מולית אדומה"], ["סולטן ברבוניה", "מולית הפסים"], ["סולטן פס-זהב", "אופון זהב-פס"],
    ["טרולוס", "טרכון"], ["טרולוס צהוב", "צנינון דו-ימי"], ["סרדינה רפיע", "טרית דקה"],
    ["סרדינה עריד", "טרית גסה"], ["סרדינה מברום", "דוסמר מצוי"],
  ]),
  ...row(15, [
    ["דניס", "ספרוס זהוב"], ["פארידה", "שינן החוט"], ["פארידה", "שפרנון שווה קוצים"], ["בקלה", "בקלה ים תיכונית"],
    ["סול", "סולית מצויה"], ["מקרוני", "אופירית נודדת"],
  ]),
  ...row(20, [
    ["בורי", "קיפון בורי"], ["דהבן", "קיפון זהוב"], ["כבאן", "קיפון חרוץ"], ["מוקשל", "קיפון כילון"],
    ["טובר", "קיפון טובר"], ["ספרינה", "אספירנה חלקה"], ["מליטה", "אספירנה מליטה"],
  ]),
  ...row(30, [["כסף", "צינון אמריקאי"], ["פלמידה לבנה", "סקומברן זריז"]]),
  ...row(40, [
    ["מוסר", "מוסר מלכותי"],
    ["דאור", "דקר הסלעים", "הוכרז כמוגן ב-2021 לשנה אחת. לא מצאתי הארכה. בספק, להחזיר למים."],
    ["ארדי", "דוקרנית אדומה"], ["לוקוס", "דקר המכמורת"],
  ]),
  ...row(70, [["טונה", "טונה כחולת סנפיר"]]),
];

export function findFish(query: string): Fish[] {
  const q = query.trim();
  if (!q) return SEA_FISH;
  return SEA_FISH.filter((f) => f.name.includes(q) || f.formal.includes(q));
}

/** בדיקה ליומן: מחזיר את המינימום אם הדג קטן ממנו. */
export function belowMinimum(name: string, sizeCm: number): number | null {
  const fish = SEA_FISH.find((f) => f.name === name.trim() || f.formal === name.trim());
  return fish && sizeCm < fish.minCm ? fish.minCm : null;
}
