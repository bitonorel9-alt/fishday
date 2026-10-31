import type { Beach } from "../domain/beaches";
import { isOffshore, isOnshore, timeScore, type Sun } from "../domain/score";

export type Tier = "great" | "good" | "ok" | "poor" | "none";

export function tierOf(score: number | null): Tier {
  if (score === null) return "none";
  if (score >= 8) return "great";
  if (score >= 6.5) return "good";
  return score >= 4.5 ? "ok" : "poor";
}

export const TIER_LABEL: Record<Tier, string> = {
  great: "מצוין",
  good: "טוב",
  ok: "בינוני",
  poor: "לא כדאי",
  none: "אין נתון",
};

const DIRECTIONS = ["צפונית", "צפון-מזרחית", "מזרחית", "דרום-מזרחית", "דרומית", "דרום-מערבית", "מערבית", "צפון-מערבית"];

export function directionName(degrees: number): string {
  return DIRECTIONS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8] ?? "";
}

export function waveText(height: number): string {
  if (height < 0.3) return "ים שטוח ומים צלולים. הדגים זהירים יותר.";
  if (height < 0.5) return "ים רגוע עם מעט תנועה.";
  if (height <= 1) return "תנועת מים טובה שמערבבת מזון.";
  if (height <= 1.4) return "ים גבוה. קשה יותר להחזיק פיתיון.";
  if (height <= 1.9) return "ים סוער. דיג קשה.";
  return "מסוכן. לא לעלות על שוברי גלים.";
}

export function windText(speed: number, direction: number, beach: Beach): string {
  const force = speed < 12 ? "רוח חלשה" : speed < 20 ? "רוח מתונה" : speed < 30 ? "רוח חזקה" : "רוח חזקה מאוד";
  const base = `${force}, ${directionName(direction)}.`;
  if (isOffshore(direction, beach)) return `${base} באה מהיבשה ונוחה להטלה.`;
  if (isOnshore(direction, beach) && speed > 15) return `${base} באה מהים ומקשה על ההטלה.`;
  return base;
}

export function timeText(hour: number, sun: Sun): string {
  const s = timeScore(hour, sun);
  if (s === 10) return "סביב זריחה או שקיעה. שעה פעילה לדגים.";
  if (s === 8) return "קרוב לזריחה או לשקיעה.";
  return s === 5 ? "לילה." : "אמצע היום. פחות פעילות.";
}

export function periodText(period: number): string {
  if (period < 4) return "גל קצר של רוח מקומית.";
  return period >= 7 ? "גל ארוך ועמוק." : "גל בינוני.";
}
