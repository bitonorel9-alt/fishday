import { describe, expect, it } from "vitest";
import { homeAdvice, hourAdvice } from "./advice";
import { BEACHES } from "./beaches";
import type { ScoredHour } from "./insights";

const sun = { sunrise: 6, sunset: 17 };
const atlit = BEACHES.find((b) => b.id === "atlit")!;
const win = { name: "עתלית", day: "מחר", start: "06:00" };
const base = { best: { name: "דדו", score: 7 }, window: win, waves: false, gusts: false, night: false };

function hour(over: Partial<ScoredHour>): ScoredHour {
  return {
    time: "2026-11-07T12:00", date: "2026-11-07", hour: 12,
    waveHeight: 0.8, wavePeriod: 6, waveDirection: 280, windSpeed: 8, windGust: 15, windDirection: 90,
    airTemp: 22, waterTemp: 24, score: 7, effectiveWave: 0.8, warnings: [], ...over,
  };
}

describe("הדג במסך הבית", () => {
  it("אזהרת גלים קודמת לכל המלצה", () => {
    expect(homeAdvice({ ...base, best: { name: "דדו", score: 9 }, waves: true }).mood).toBe("warn");
  });
  it("בלילה מפנה לחלון הבא", () => {
    const a = homeAdvice({ ...base, night: true });
    expect(a.mood).toBe("night");
    expect(a.text).toContain("עתלית, מחר ב-06:00");
  });
  it("ציון גבוה: מתלהב, עם שם החוף והציון", () => {
    const a = homeAdvice({ ...base, best: { name: "דדו", score: 8.4 } });
    expect(a.mood).toBe("great");
    expect(a.text).toContain("דדו עכשיו על 8.4");
  });
  it("ציון טוב: ממליץ, ומציע חלון בחוף אחר", () => {
    const a = homeAdvice(base);
    expect(a.mood).toBe("recommend");
    expect(a.text).toContain("לדדו");
    expect(a.text).toContain("עתלית");
  });
  it("לא מציע לחכות לאותו חוף", () => {
    expect(homeAdvice({ ...base, best: { name: "עתלית", score: 7 } }).text).not.toContain("לחכות");
  });
  it("ציון נמוך: טיפ לחכות", () => {
    expect(homeAdvice({ ...base, best: { name: "דדו", score: 4 } }).mood).toBe("tip");
  });
  it("בלי נתונים לא ממציא", () => {
    expect(homeAdvice({ ...base, best: null }).text).toContain("אין לי");
  });
});

describe("הדג על שעה בחוף", () => {
  it("גלים מסוכנים: אזהרה", () => {
    expect(hourAdvice(hour({ warnings: [{ kind: "waves" }] }), atlit, sun).mood).toBe("warn");
  });
  it("ציון מצוין בשקיעה מסביר למה", () => {
    const a = hourAdvice(hour({ hour: 17, score: 8.5 }), atlit, sun);
    expect(a.mood).toBe("great");
    expect(a.text).toContain("שקיעה");
  });
  it("רוח מהיבשה היא סיבה טובה", () => {
    expect(hourAdvice(hour({ score: 7, windDirection: 105 }), atlit, sun).text).toContain("מהיבשה");
  });
  it("לילה חלש: מצב לילה", () => {
    expect(hourAdvice(hour({ hour: 1, score: 5 }), atlit, sun).mood).toBe("night");
  });
  it("ים שטוח: טיפ על חוט דק", () => {
    expect(hourAdvice(hour({ score: 5, effectiveWave: 0.1 }), atlit, sun).text).toContain("חוט דק");
  });
  it("בלי ציון לא ממציא", () => {
    expect(hourAdvice(hour({ score: null }), atlit, sun).text).toContain("אין לי");
  });
});
