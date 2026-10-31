import type { Bottom } from "../domain/beaches";

export interface FishInfo {
  id: string;
  name: string;
  formal: string;
  scientific: string;
  /** שכיחות בשלל מהחוף בישראל, לפי Frid et al. 2023. */
  share: string;
  /** 0–1, מתורגם מהסקר. בסיס למדד ההתאמה. */
  commonness: number;
  /** 0–1, כמה סוג החוף מתאים לדג. */
  habitat: Record<Bottom, number>;
  where: string;
  size: string;
  food: string;
  bait: string;
  facts: string[];
  warning?: string;
  minCm?: number;
  bannedInBreeding?: boolean;
  fishbase: string;
}

const fishbase = (name: string) => `https://www.fishbase.se/summary/${name}.html`;

export const FISH: FishInfo[] = [
  {
    id: "sillago", name: "סילגו", formal: "Sillago", scientific: "Sillago suezensis",
    share: "48% מהדגים בסקר", commonness: 1, habitat: { sand: 1, mixed: 0.7, rock: 0.25 },
    where: "מעל חול, במים רדודים מול חופים חוליים.",
    size: "עד 18.5 ס\"מ", food: "תולעים וסרטנים קטנים", bait: "תולעים. זה מה שהוא אוכל בטבע.",
    facts: ["הדג הנפוץ ביותר בחכה מהחוף בישראל.", "הגיע מהים האדום דרך תעלת סואץ.", "מתרבה בין אפריל לספטמבר."],
    fishbase: fishbase("Sillago-suezensis"),
  },
  {
    id: "siganus", name: "סיכן משויש", formal: "ארס", scientific: "Siganus rivulatus",
    share: "13% מהדגים, 17% מהמשקל", commonness: 0.85, habitat: { rock: 1, mixed: 0.8, sand: 0.3 },
    where: "מים רדודים ליד סלעים, בלהקות של עשרות עד מאות דגים.",
    size: "לרוב 20 ס\"מ, עד 30 ס\"מ", food: "אצות", bait: "צמחוני, לכן פיתיון בשרי פחות מתאים. נסה בצק.",
    facts: ["מין פולש מהים האדום.", "מרעה אצות על הסלעים ופוגע בכיסוי שלהן.", "כשהוא נבהל, הגוף שלו מקבל כתמים."],
    warning: "הקוצים ארסיים. אוחזים בזהירות, ובעדיפות עם כפפה.",
    fishbase: fishbase("Siganus-rivulatus"),
  },
  {
    id: "sargus", name: "סרגוס", formal: "סרגוס מסורטט", scientific: "Diplodus sargus",
    share: "12% מהדגים, 16% מהמשקל", commonness: 0.85, habitat: { rock: 1, mixed: 0.8, sand: 0.3 },
    where: "סלעים ואצות, ובאזור שבירת הגלים. פעיל במיוחד עם שחר.",
    size: "לרוב 22 ס\"מ, עד 45 ס\"מ", food: "רכיכות וחסרי חוליות מהקרקעית", bait: "גמברי, קלמרי, תולעים או בצק.",
    facts: ["מתרבה בינואר עד מרץ.", "מין מקומי, לא פולש.", "דורש פיתיון שמחזיק בים עובד."],
    minCm: 11, fishbase: fishbase("Diplodus-sargus"),
  },
  {
    id: "bori", name: "בורי", formal: "קיפון בורי", scientific: "Mugil cephalus",
    share: "הקיפונים: 17% מהמשקל", commonness: 0.75, habitat: { sand: 0.9, mixed: 0.9, rock: 0.6 },
    where: "מים רדודים עד 10 מ', בלהקות מעל חול ובוץ, וליד שפכי נחלים.",
    size: "לרוב 50 ס\"מ", food: "אצות מיקרוסקופיות וחומר אורגני", bait: "בצק.",
    facts: ["מתרבה בים, והצעירים חוזרים לחוף.", "בשנת 2026 הוצא מרשימת האיסור של תקופת הרבייה.", "מגיע לגיל 16."],
    minCm: 20, fishbase: fishbase("Mugil-cephalus"),
  },
  {
    id: "mormyrus", name: "מרמיר", formal: "שישן מסורטט", scientific: "Lithognathus mormyrus",
    share: "פחות מ-7%", commonness: 0.5, habitat: { sand: 1, mixed: 0.7, rock: 0.2 },
    where: "קרקעית חול ובוץ, לרוב בעומק 10–20 מ'.",
    size: "לרוב 30 ס\"מ, עד 55 ס\"מ", food: "תולעים, רכיכות וסרטנים", bait: "תולעים או גמברי.",
    facts: ["חי בלהקות.", "משנה מין במהלך החיים לפי חלק מהמחקרים.", "נחשב טעים מאוד."],
    minCm: 11, bannedInBreeding: true, fishbase: fishbase("Lithognathus-mormyrus"),
  },
  {
    id: "denis", name: "דניס", formal: "ספרוס זהוב", scientific: "Sparus aurata",
    share: "פחות מ-7%", commonness: 0.5, habitat: { sand: 0.9, mixed: 1, rock: 0.5 },
    where: "חול, עשב ים ואזור שבירת הגלים.",
    size: "לרוב 35 ס\"מ, עד 70 ס\"מ", food: "צדפות, מולים ורכיכות", bait: "גמברי.",
    facts: ["נולד זכר והופך לנקבה בגיל 3 בערך.", "מתרבה באוקטובר עד דצמבר.", "מגיע לגיל 14."],
    minCm: 15, fishbase: fishbase("Sparus-aurata"),
  },
  {
    id: "caranx", name: "צנינון כחול", formal: "Blue runner", scientific: "Caranx crysos",
    share: "כ-11 טון בשנה מהחוף", commonness: 0.45, habitat: { rock: 0.8, mixed: 0.8, sand: 0.7 },
    where: "ליד החוף, בלהקות שנעות מהר.",
    size: "לרוב 40 ס\"מ", food: "דגים קטנים ושרימפס", bait: "דג קטן או שרימפס.",
    facts: ["דג ספורט חזק.", "רוב השלל שלו בישראל מגיע מחכות מהחוף."],
    fishbase: fishbase("Caranx-crysos"),
  },
  {
    id: "palamida", name: "פלמידה לבנה", formal: "סקומברן זריז", scientific: "Scomberomorus commerson",
    share: "נדיר מהחוף", commonness: 0.15, habitat: { rock: 0.6, mixed: 0.6, sand: 0.6 },
    where: "מים פתוחים. לרוב נתפס בסירה.",
    size: "לרוב 120 ס\"מ", food: "דגים קטנים וקלמרי", bait: "דג קטן.",
    facts: ["הגיע מהים האדום.", "צד בדרך כלל לבד.", "נודד למרחקים לאורך החוף."],
    minCm: 30, fishbase: fishbase("Scomberomorus-commerson"),
  },
  {
    id: "puffer", name: "נפוחית", formal: "Silver-cheeked toadfish", scientific: "Lagocephalus sceleratus",
    share: "נדיר מהחוף", commonness: 0.15, habitat: { rock: 0.4, mixed: 0.4, sand: 0.4 },
    where: "לרוב מעומק 18 מ' ומעלה.",
    size: "לרוב 40 ס\"מ", food: "טורף", bait: "לא מיועד לדיג.",
    facts: ["הדג הנפוץ ביותר בדיג ספורטיבי בים לפי משקל.", "השיניים חותכות חוטים וכל דג שנתפס בחכה."],
    warning: "רעיל מאוד. אסור לאכול אותו, גם לא מבושל. ב-2008 נרשמו בישראל 13 מקרי הרעלה.",
    fishbase: fishbase("Lagocephalus-sceleratus"),
  },
  {
    id: "lionfish", name: "זהרון", formal: "זהרון הדור", scientific: "Pterois miles",
    share: "נדיר מהחוף", commonness: 0.1, habitat: { rock: 0.6, mixed: 0.3, sand: 0.1 },
    where: "סלעים ומסתור מתחת לפני המים.",
    size: "עד 43 ס\"מ", food: "דגים קטנים", bait: "לא נפוץ בחכה.",
    facts: ["מין פולש מהים האדום.", "אין עליו מכסת שלל יומית."],
    warning: "קוצים ארסיים מאוד. לא לגעת ביד.",
    fishbase: fishbase("Pterois-miles"),
  },
];
