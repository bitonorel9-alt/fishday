import { describe, expect, it } from "vitest";
import type { Forecast, ForecastHour } from "../data/forecast";
import { BEACHES } from "./beaches";
import { bestNow, hasWarningSoon, nextWindow, scoreForecast } from "./insights";
import { moonPhase } from "./moon";
import { addDays, formatHour, hourOf, israelNow } from "./time";

const date = "2026-10-31";
const sun = { sunrise: 6, sunset: 17 };

function hour(day: string, h: number, over: Partial<ForecastHour> = {}): ForecastHour {
  return {
    time: `${day}T${String(h).padStart(2, "0")}:00`,
    date: day,
    hour: h,
    waveHeight: 0.8,
    wavePeriod: 6,
    waveDirection: 280,
    windSpeed: 8,
    windGust: 15,
    windDirection: 90,
    airTemp: 22,
    waterTemp: 25,
    ...over,
  };
}

function forecast(over: (id: string, h: ForecastHour) => Partial<ForecastHour> = () => ({})): Forecast {
  const tomorrow = addDays(date, 1);
  const hours: Record<string, ForecastHour[]> = {};
  for (const b of BEACHES) {
    hours[b.id] = [date, tomorrow].flatMap((d) =>
      Array.from({ length: 24 }, (_, h) => {
        const base = hour(d, h);
        return { ...base, ...over(b.id, base) };
      }),
    );
  }
  return { fetchedAt: 0, days: [{ date, sun }, { date: tomorrow, sun }], hours };
}

describe("bestNow", () => {
  it("לא בוחר שמורה", () => {
    const s = scoreForecast(forecast((id) => (id === "dor-habonim" ? {} : { waveHeight: 2.5 })));
    const best = bestNow(s, { date, hour: 7 });
    expect(best?.beach.id).not.toBe("dor-habonim");
  });
  it("נתון חסר: לא ממליץ", () => {
    const s = scoreForecast(forecast(() => ({ waveHeight: null })));
    expect(bestNow(s, { date, hour: 7 })).toBeNull();
  });
});

describe("nextWindow", () => {
  it("חלון של 3 שעות סביב הזריחה", () => {
    const w = nextWindow(scoreForecast(forecast()), { date, hour: 3 });
    expect(w).not.toBeNull();
    expect((w!.endHour - w!.startHour + 24) % 24).toBe(3);
    expect(w!.startHour).toBeGreaterThanOrEqual(4);
    expect(w!.endHour).toBeLessThanOrEqual(9);
  });
  it("מדלג על שעה עם אזהרה", () => {
    const s = scoreForecast(forecast((_, h) => ({ windGust: 45, ...(h.hour === 16 && h.date === date ? { windGust: 10 } : {}) })));
    const w = nextWindow(s, { date, hour: 3 });
    expect(w?.startHour).toBe(16);
  });
  it("בלי שעה טובה מחזיר את השעה הכי טובה", () => {
    const s = scoreForecast(forecast(() => ({ waveHeight: 1.75, windSpeed: 35 })));
    expect(nextWindow(s, { date, hour: 3 })).not.toBeNull();
  });
  it("הכל בלי נתונים: אין חלון", () => {
    const s = scoreForecast(forecast(() => ({ windSpeed: null })));
    expect(nextWindow(s, { date, hour: 3 })).toBeNull();
  });
});

describe("hasWarningSoon", () => {
  it("מזהה גלים גבוהים בקרוב", () => {
    const s = scoreForecast(forecast((_, h) => (h.hour === 20 ? { waveHeight: 2 } : {})));
    expect(hasWarningSoon(s, { date, hour: 10 })).toEqual({ waves: true, gusts: false });
  });
});

describe("זמן וירח", () => {
  it("שעון ישראל", () => expect(israelNow(new Date("2026-10-31T22:30:00Z"))).toEqual({ date: "2026-11-01", hour: 0 }));
  it("שעה עשרונית", () => expect(hourOf("2026-10-31T05:30")).toBe(5.5));
  it("פורמט שעה", () => expect(formatHour(16.84)).toBe("16:50"));
  it("מעבר חודש", () => expect(addDays("2026-10-31", 1)).toBe("2026-11-01"));
  it("מולד ידוע", () => {
    const p = moonPhase(new Date("2024-04-08T18:21:00Z")).phase;
    expect(Math.min(p, 1 - p)).toBeLessThan(0.03);
  });
  it("ירח מלא ידוע", () => {
    const m = moonPhase(new Date("2024-03-25T07:00:00Z"));
    expect(Math.abs(m.phase - 0.5)).toBeLessThan(0.03);
    expect(m.illumination).toBeGreaterThan(0.95);
  });
});
