import type { FishInfo } from "../content/fish";
import type { Bottom } from "./beaches";

/** שיא השלל מהחוף לפי Frid et al. 2023: אוקטובר עד פברואר. month הוא 1–12. */
export const isPeakMonth = (month: number) => month >= 10 || month <= 2;

/** מדד התאמה באחוזים: שכיחות × סוג חוף × עונה. לא סיכוי סטטיסטי לתפוס דג. */
export function matchPercent(fish: FishInfo, bottom: Bottom, month: number): number {
  const season = isPeakMonth(month) ? 1 : 0.75;
  return Math.round(fish.commonness * fish.habitat[bottom] * season * 100);
}

export interface BeachFish {
  fish: FishInfo;
  match: number;
}

export function fishForBeach(all: FishInfo[], bottom: Bottom, month: number, limit = 5): BeachFish[] {
  return all
    .filter((fish) => !fish.warning || fish.commonness > 0.5)
    .map((fish) => ({ fish, match: matchPercent(fish, bottom, month) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, limit);
}

export interface LogShare {
  fish: string;
  count: number;
  percent: number;
}

/** אחוזים אמיתיים מהיומן של המשתמש, לחוף אחד. */
export function logShares(entries: { beachId: string; fish: string }[], beachId: string): LogShare[] {
  const here = entries.filter((e) => e.beachId === beachId);
  const counts = new Map<string, number>();
  for (const e of here) counts.set(e.fish, (counts.get(e.fish) ?? 0) + 1);
  return [...counts]
    .map(([fish, count]) => ({ fish, count, percent: Math.round((count / here.length) * 100) }))
    .sort((a, b) => b.count - a.count);
}
