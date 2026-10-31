import type { Beach } from "./beaches";

/** נתוני שעה אחת בים הפתוח. null = השרת לא החזיר ערך. */
export interface HourConditions {
  hour: number;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: number | null;
}

export interface Sun {
  sunrise: number;
  sunset: number;
}

export interface Warning {
  kind: "waves" | "gusts";
}

export interface HourScore {
  /** null = אין מספיק נתונים. לעולם לא ננחש ציון. */
  score: number | null;
  effectiveWave: number | null;
  warnings: Warning[];
}

export const WAVE_WARNING_M = 1.8;
export const GUST_WARNING_KMH = 40;
const WAVE_CAP_M = 2;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** הפרש זוויות קצר ביותר, 0 עד 180. */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** גובה הגל שמגיע לחוף, לפי הזווית בין כיוון הגל לכיוון שהחוף פונה אליו. */
export function effectiveWave(height: number, direction: number, beach: Beach): number {
  const angle = (angleDiff(direction, beach.facing) * Math.PI) / 180;
  const alignment = Math.max(Math.cos(angle), 0.3);
  return height * alignment * beach.exposure;
}

export function waveScore(h: number): number {
  if (h < 0.3) return 5;
  if (h < 0.5) return 8;
  if (h <= 1.0) return 10;
  if (h <= 1.4) return 7;
  if (h <= 1.9) return 4;
  return 1;
}

/** גל קצר הוא גל רוח מקומי, גל ארוך מערבב מים טוב יותר. */
export function periodAdjustment(period: number): number {
  if (period < 4) return -0.5;
  if (period >= 7) return 0.5;
  return 0;
}

export function isOnshore(windDirection: number, beach: Beach): boolean {
  return angleDiff(windDirection, beach.facing) <= 70;
}

export function isOffshore(windDirection: number, beach: Beach): boolean {
  return angleDiff(windDirection, beach.facing) >= 135;
}

export function windScore(speed: number, direction: number, beach: Beach): number {
  let s = speed < 12 ? 10 : speed < 20 ? 8 : speed < 30 ? 5 : speed < 40 ? 3 : 1;
  if (isOnshore(direction, beach) && speed > 15) s -= 1.5;
  if (isOffshore(direction, beach) && speed < 25) s += 0.5;
  return clamp(s, 1, 10);
}

/** hour הוא תחילת השעה, לכן מודדים מאמצע השעה. */
export function timeScore(hour: number, sun: Sun): number {
  const t = hour + 0.5;
  const dist = Math.min(Math.abs(t - sun.sunrise), Math.abs(t - sun.sunset));
  if (dist <= 1.5) return 10;
  if (dist <= 3) return 8;
  return t > sun.sunrise && t < sun.sunset ? 4 : 5;
}

export function scoreHour(c: HourConditions, sun: Sun, beach: Beach): HourScore {
  // האזהרות לפי הים הפתוח: גל שמגיע לחוף מוגן עדיין מסוכן על שובר גלים.
  const warnings: Warning[] = [];
  if (c.waveHeight !== null && c.waveHeight >= WAVE_WARNING_M) warnings.push({ kind: "waves" });
  if (c.windGust !== null && c.windGust >= GUST_WARNING_KMH) warnings.push({ kind: "gusts" });

  if (c.waveHeight === null || c.waveDirection === null || c.windSpeed === null || c.windDirection === null) {
    return { score: null, effectiveWave: null, warnings };
  }

  const wave = effectiveWave(c.waveHeight, c.waveDirection, beach);
  const waves = clamp(waveScore(wave) + (c.wavePeriod === null ? 0 : periodAdjustment(c.wavePeriod)), 1, 10);
  let s = 0.4 * waves + 0.3 * windScore(c.windSpeed, c.windDirection, beach) + 0.3 * timeScore(c.hour, sun);
  if (c.windGust !== null && c.windGust >= GUST_WARNING_KMH) s -= 1.5;
  if (c.waveHeight >= WAVE_CAP_M) s = Math.min(s, 2);
  return { score: Math.round(clamp(s, 1, 10) * 10) / 10, effectiveWave: wave, warnings };
}

/** החוף הכי טוב מתוך מועמדים: שמורה ושעה בלי נתונים לא מועמדות. */
export function bestBeach<T extends { beach: Beach; score: number | null }>(items: T[]): T | null {
  let best: T | null = null;
  for (const item of items) {
    if (item.beach.legal === "reserve" || item.score === null) continue;
    if (best === null || item.score > (best.score as number)) best = item;
  }
  return best;
}
