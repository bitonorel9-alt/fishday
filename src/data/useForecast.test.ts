import { describe, expect, it } from "vitest";
import type { Forecast } from "./forecast";
import { needsRefresh } from "./useForecast";

const hour = { time: "2026-11-06T06:00", date: "2026-11-06" } as Forecast["hours"][string][number];
const cached = (fetchedAt: number, ids: string[]): Forecast => ({ fetchedAt, days: [], hours: Object.fromEntries(ids.map((id) => [id, [hour]])) });

describe("needsRefresh", () => {
  const now = 10 * 3600_000;
  it("טוען כשאין תחזית או שהיא בת שעה", () => {
    expect(needsRefresh(null, now, ["a"])).toBe(true);
    expect(needsRefresh(cached(now - 3600_000, ["a"]), now, ["a"])).toBe(true);
  });
  it("לא טוען תחזית טרייה שמכסה את כל החופים", () => {
    expect(needsRefresh(cached(now - 60_000, ["a", "b"]), now, ["a", "b"])).toBe(false);
  });
  it("טוען כשנוסף חוף שאין לו נתונים בתחזית השמורה", () => {
    expect(needsRefresh(cached(now - 60_000, ["a"]), now, ["a", "b"])).toBe(true);
  });
});
