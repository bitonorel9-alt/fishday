import type { Forecast, ForecastHour } from "../data/forecast";
import { BEACHES, type Beach } from "./beaches";
import { bestBeach, scoreHour, type HourScore } from "./score";
import { addDays, pad2, type LocalNow } from "./time";

const WINDOW_HOURS = 3;

export interface ScoredHour extends ForecastHour, HourScore {}
export type ScoredForecast = Record<string, ScoredHour[]>;

export interface Spot {
  beach: Beach;
  hour: ScoredHour;
  score: number | null;
}

export interface FishingWindow {
  beach: Beach;
  date: string;
  startHour: number;
  /** שעת סיום, לא כולל. */
  endHour: number;
  average: number;
}

export function scoreForecast(forecast: Forecast): ScoredForecast {
  const sunByDate = new Map(forecast.days.map((d) => [d.date, d.sun]));
  const out: ScoredForecast = {};
  for (const beach of BEACHES) {
    out[beach.id] = (forecast.hours[beach.id] ?? []).flatMap((h) => {
      const sun = sunByDate.get(h.date);
      return sun ? [{ ...h, ...scoreHour(h, sun, beach) }] : [];
    });
  }
  return out;
}

const timeKey = (now: LocalNow) => `${now.date}T${pad2(now.hour)}:00`;

export function hourAt(hours: ScoredHour[], now: LocalNow): ScoredHour | null {
  const key = timeKey(now);
  return hours.find((h) => h.time === key) ?? null;
}

export function spotsNow(scored: ScoredForecast, now: LocalNow): Spot[] {
  return BEACHES.flatMap((beach) => {
    const hour = hourAt(scored[beach.id] ?? [], now);
    return hour ? [{ beach, hour, score: hour.score }] : [];
  });
}

export function bestNow(scored: ScoredForecast, now: LocalNow): Spot | null {
  return bestBeach(spotsNow(scored, now));
}

/** השעות שנשארו מהרגע הזה ועד 24 שעות קדימה, בלי השעה הנוכחית. */
function nextHours(hours: ScoredHour[], now: LocalNow): ScoredHour[] {
  const start = timeKey(now);
  const end = timeKey({ date: addDays(now.date, 1), hour: now.hour });
  return hours.filter((h) => h.time > start && h.time <= end);
}

/** חלון של עד 3 שעות רצופות עם הממוצע הגבוה ביותר ב-24 השעות הבאות. בלי שעות עם אזהרה ובלי חופי שמורה. */
export function nextWindow(scored: ScoredForecast, now: LocalNow): FishingWindow | null {
  let best: FishingWindow | null = null;
  for (const beach of BEACHES) {
    if (beach.legal === "reserve") continue;
    const hours = nextHours(scored[beach.id] ?? [], now);
    hours.forEach((_, i) => {
      const run: ScoredHour[] = [];
      for (const h of hours.slice(i, i + WINDOW_HOURS)) {
        if (h.score === null || h.warnings.length > 0) break;
        run.push(h);
      }
      const first = run[0];
      const last = run[run.length - 1];
      if (!first || !last) return;
      const average = run.reduce((sum, h) => sum + (h.score ?? 0), 0) / run.length;
      // חלון קצר מ-3 שעות מנצח רק אם הוא טוב יותר, ובתיקו מעדיפים את המוקדם.
      if (best === null || average > best.average) {
        best = { beach, date: first.date, startHour: first.hour, endHour: (last.hour + 1) % 24, average };
      }
    });
  }
  return best && { ...(best as FishingWindow), average: Math.round((best as FishingWindow).average * 10) / 10 };
}

/** כל האזהרות ב-24 השעות הבאות, לפי החמורה ביותר בכל חוף. */
export function hasWarningSoon(scored: ScoredForecast, now: LocalNow): { waves: boolean; gusts: boolean } {
  const flags = { waves: false, gusts: false };
  for (const beach of BEACHES) {
    const nowHour = hourAt(scored[beach.id] ?? [], now);
    for (const h of [...(nowHour ? [nowHour] : []), ...nextHours(scored[beach.id] ?? [], now)]) {
      for (const w of h.warnings) flags[w.kind] = true;
    }
  }
  return flags;
}
