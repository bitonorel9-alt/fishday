import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BEACHES } from "./beaches";
import { scoreHour, type HourConditions } from "./score";

/** טוען את סקריפט הווידג'ט כמו מודול, בלי הסביבה של Scriptable. */
function loadWidget() {
  const code = readFileSync(resolve(process.cwd(), "public/widget/fishday-widget.js"), "utf8").replace("if (typeof Script !== \"undefined\") await main();\nelse ", "");
  const module = { exports: {} as Record<string, never> };
  new Function("module", code)(module);
  return module.exports as unknown as {
    BEACHES: { id: string; name: string; facing: number; shelteredFrom?: number[]; reserve: boolean; lat: number; lon: number }[];
    scoreHour: (c: HourConditions, sun: { sunrise: number; sunset: number }, beach: unknown) => number | null;
    pick: (data: unknown, now: { date: string; hour: number }, wanted?: string) => { row: { beach: { id: string }; score: number | null } | null };
  };
}

const widget = loadWidget();
const sun = { sunrise: 6, sunset: 17 };

describe("הווידג'ט זהה לאפליקציה", () => {
  it("אותם חופים ואותם ערכים", () => {
    for (const b of BEACHES) {
      const w = widget.BEACHES.find((x) => x.id === b.id)!;
      expect([w.name, w.lat, w.lon, w.facing, w.shelteredFrom, w.reserve]).toEqual([b.name, b.lat, b.lon, b.facing, b.shelteredFrom, b.legal === "reserve"]);
    }
  });

  it("אותו ציון ב-3,000 מצבים", () => {
    let seed = 7;
    const rnd = (max: number) => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) * max; };
    for (let i = 0; i < 3000; i++) {
      const c: HourConditions = {
        hour: Math.floor(rnd(24)), waveHeight: rnd(3), wavePeriod: rnd(10), waveDirection: rnd(360),
        windSpeed: rnd(50), windGust: rnd(70), windDirection: rnd(360),
      };
      const b = BEACHES[i % BEACHES.length]!;
      const app = scoreHour(c, sun, b).score;
      expect(widget.scoreHour(c, sun, widget.BEACHES.find((x) => x.id === b.id))).toBe(app);
    }
  });
});

describe("בחירת חוף בווידג'ט", () => {
  const n = BEACHES.length;
  const time = ["2026-11-01T06:00"];
  const data = {
    marine: Array.from({ length: n }, () => ({ hourly: { time, wave_height: [0.8], wave_period: [6], wave_direction: [280] } })),
    weather: Array.from({ length: n }, () => ({
      hourly: { time, wind_speed_10m: [8], wind_gusts_10m: [15], wind_direction_10m: [90] },
      daily: { sunrise: ["2026-11-01T06:00"], sunset: ["2026-11-01T17:00"] },
    })),
  };
  const now = { date: "2026-11-01", hour: 6 };
  it("לא בוחר שמורה", () => expect(widget.pick(data, now).row?.beach.id).not.toBe("dor-habonim"));
  it("פרמטר בוחר חוף", () => expect(widget.pick(data, now, "עתלית").row?.beach.id).toBe("atlit"));
  it("שעה חסרה: אין ציון", () => expect(widget.pick(data, { date: "2026-11-02", hour: 6 }).row).toBeNull());
});
