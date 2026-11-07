import type { Beach } from "./beaches";
import type { ScoredHour } from "./insights";
import { GUST_WARNING_KMH, isOffshore, isOnshore, timeScore, WAVE_WARNING_M, type Sun } from "./score";

/** מצב הרוח של הדג. כל מצב מתאים להבעה אחרת במדליון. */
export type Mood = "hello" | "recommend" | "great" | "warn" | "tip" | "night";

export interface Advice {
  mood: Mood;
  text: string;
}

export interface WindowLabel {
  name: string;
  day: string;
  start: string;
}

const windowText = (w: WindowLabel) => `${w.name}, ${w.day} ב-${w.start}`;

const GREETINGS: Record<"morning" | "noon" | "evening" | "night", string[]> = {
  morning: [
    "בוקר טוב. הים כבר ער, ואני כבר בדקתי אותו בשבילך.",
    "בוקר טוב. קפה, חכה, ויוצאים.",
    "בוקר טוב. עכשיו הדגים הכי רעבים.",
  ],
  noon: [
    "צהריים טובים. הים יחכה לשקיעה, וגם אני.",
    "שלום. בוא נראה איפה שווה להיות הערב.",
    "צהריים טובים. זה הזמן להכין פיתיון.",
  ],
  evening: [
    "ערב טוב. שעת הזהב מתקרבת.",
    "ערב טוב. השמש יורדת, והדגים עולים.",
    "ערב טוב. אין כמו שקיעה עם חכה ביד.",
  ],
  night: [
    "לילה טוב. אני כבר מתכנן לך את הבוקר.",
    "לילה טוב. הים נח, ומחר מתחילים מוקדם.",
    "ערב שקט. הכוכבים בחוץ, והדגים בבית.",
  ],
};
const ALWAYS = ["שלום, אני דני. אני מכיר כל חוף מאכזיב ועד זיקים.", "ים טוב, רוח טובה, וחכה מלאה."];

/** מכניס את השם אחרי הברכה: "בוקר טוב, אוראל." */
export function withName(line: string, name: string | null): string {
  if (!name) return line;
  const opener = line.match(/^(בוקר טוב|צהריים טובים|ערב טוב|לילה טוב|ערב שקט)\./);
  if (opener) return line.replace(opener[0], `${opener[1]}, ${name}.`);
  if (line.startsWith("שלום,")) return line.replace("שלום,", `שלום ${name},`);
  if (line.startsWith("שלום.")) return line.replace("שלום.", `שלום ${name}.`);
  return `${name}, ${line}`;
}

/** משפט פתיחה של דני לפי שעת היום. pick בין 0 ל-1, כדי שכל כניסה תקבל משפט אחר. */
export function greeting(hour: number, pick: number, name: string | null = null): string {
  const part = hour >= 5 && hour < 11 ? "morning" : hour >= 11 && hour < 16 ? "noon" : hour >= 16 && hour < 20 ? "evening" : "night";
  const pool = [...GREETINGS[part], ...ALWAYS];
  return withName(pool[Math.min(pool.length - 1, Math.floor(pick * pool.length))]!, name);
}

/** מה הדג אומר במסך הבית. בטיחות קודמת לכל דבר אחר. */
export function homeAdvice(o: {
  best: { name: string; score: number | null } | null;
  window: WindowLabel | null;
  waves: boolean;
  gusts: boolean;
  night: boolean;
}): Advice {
  if (o.waves) return { mood: "warn", text: `גלים מעל ${WAVE_WARNING_M} מ' ביממה הקרובה. נהנים מהחוף, לא עולים על שוברי הגלים.` };
  if (o.gusts) return { mood: "warn", text: `משבי רוח מעל ${GUST_WARNING_KMH} קמ"ש ביממה הקרובה. תתרחק מהקצה ותחזיק חזק את החכה.` };
  if (o.night) {
    return o.window
      ? { mood: "night", text: `עכשיו לילה. החלון הבא שלי: ${windowText(o.window)}.` }
      : { mood: "night", text: "עכשיו לילה. נדבר בזריחה." };
  }
  if (!o.best || o.best.score === null) return { mood: "tip", text: "אין לי עדיין נתונים לשעה הזו." };
  const { name, score } = o.best;
  if (score >= 8) return { mood: "great", text: `${name} עכשיו על ${score.toFixed(1)}. ים כזה לא מפספסים.` };
  if (score >= 6.5) {
    const later = o.window && o.window.name !== name ? ` ואם אפשר לחכות: ${windowText(o.window)}.` : "";
    return { mood: "recommend", text: `הייתי הולך עכשיו ל${name}.${later}` };
  }
  return o.window
    ? { mood: "tip", text: `עכשיו הים לא משהו. שווה לחכות: ${windowText(o.window)}.` }
    : { mood: "tip", text: "עכשיו הים לא משהו. תבדוק אותי שוב לקראת השקיעה." };
}

/** מה הדג אומר על שעה מסוימת בחוף מסוים: הסיבה העיקרית, במשפט אחד. */
export function hourAdvice(hour: ScoredHour, beach: Beach, sun: Sun): Advice {
  if (hour.warnings.some((w) => w.kind === "waves")) return { mood: "warn", text: "בשעה הזו מסוכן. לא עולים על סלעים ושוברי גלים." };
  if (hour.warnings.some((w) => w.kind === "gusts")) return { mood: "warn", text: "משבים חזקים. עדיף לחכות שיירגע." };
  if (hour.score === null) return { mood: "tip", text: "אין לי נתון לשעה הזו." };

  const time = timeScore(hour.hour, sun);
  const wave = hour.effectiveWave;
  const offshore = hour.windDirection !== null && isOffshore(hour.windDirection, beach);
  const onshoreStrong = hour.windDirection !== null && hour.windSpeed !== null && hour.windSpeed > 15 && isOnshore(hour.windDirection, beach);
  const reason = time === 10 ? "זו שעה של זריחה או שקיעה, והדגים פעילים." : offshore ? "הרוח מהיבשה, וההטלה קלה." : wave !== null && wave >= 0.5 && wave <= 1 ? "יש תנועת מים טובה." : "";

  if (hour.score >= 8) return { mood: "great", text: `שעה מצוינת. ${reason || "כל התנאים מסתדרים."}`.trim() };
  if (hour.score >= 6.5) return { mood: "recommend", text: `שעה טובה. ${reason || "שווה לצאת."}`.trim() };
  if (time === 5) return { mood: "night", text: "בלילה יש פחות פעילות. אם אתה בא, תביא פנס ופיתיון עם ריח חזק." };
  if (wave !== null && wave < 0.3) return { mood: "tip", text: "הים שטוח מדי והדגים זהירים. נסה חוט דק ופיתיון קטן." };
  if (wave !== null && wave > 1.4) return { mood: "tip", text: "ים גבוה. משקולת כבדה יותר תחזיק את הפיתיון במקום." };
  if (onshoreStrong) return { mood: "tip", text: "רוח חזקה מהים מקשה על ההטלה. חפש פינה מוגנת." };
  return { mood: "tip", text: "אמצע היום, פחות פעילות. שווה לחכות לשקיעה." };
}
